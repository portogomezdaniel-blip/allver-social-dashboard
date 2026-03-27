import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { ig_handle, display_name, message } = await req.json();

    if (!ig_handle || !message) {
      return NextResponse.json({ error: "ig_handle and message required" }, { status: 400 });
    }

    // 1. Find or create lead
    const { data: existingLeads } = await supabase
      .from("setter_leads")
      .select("*")
      .eq("ig_handle", ig_handle);

    let lead = existingLeads?.[0];

    if (!lead) {
      const { data: newLead, error: createErr } = await supabase
        .from("setter_leads")
        .insert({ ig_handle, display_name: display_name || null, status: "new" })
        .select()
        .single();
      if (createErr) throw createErr;
      lead = newLead;
    }

    // 2. Fetch conversation history
    const { data: messages } = await supabase
      .from("setter_messages")
      .select("role, content")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true })
      .limit(20);

    // 3. Fetch capacity
    const { data: capacity } = await supabase
      .from("setter_capacity")
      .select("*")
      .eq("id", 1)
      .single();

    // 4. Fetch system prompt from DB
    const { data: promptData } = await supabase
      .from("agent_prompts")
      .select("system_prompt")
      .eq("agent_name", "mauro-setter")
      .eq("is_active", true)
      .single();

    if (!promptData) {
      return NextResponse.json({ error: "Setter prompt not found" }, { status: 500 });
    }

    // 5. Build conversation for Claude
    const conversationHistory = (messages ?? []).map((m) => ({
      role: (m.role === "lead" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

    const contextMessage = `CONTEXTO ACTUAL:
- Slots disponibles: ${capacity?.slots_available ?? "?"}
- Status del lead: ${lead.status}
- Handle: ${lead.ig_handle}
- Experiencia reportada: ${lead.experience_years ?? "no reportada"}
- Meta: ${lead.training_goal ?? "no reportada"}
- Números S/B/D: ${lead.current_numbers ? JSON.stringify(lead.current_numbers) : "no reportados"}

MENSAJE NUEVO DEL LEAD:
${message}`;

    conversationHistory.push({ role: "user", content: contextMessage });

    // 6. Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: promptData.system_prompt,
      messages: conversationHistory,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // 7. Parse classification
    const classMatch = text.match(/<classification>([\s\S]*?)<\/classification>/);
    let classification = { action: "respond", status: "qualifying", response: text, lead_data: {}, escalation_reason: null as string | null };

    if (classMatch) {
      try {
        const raw = classMatch[1].replace(/```json\n?/g, "").replace(/```/g, "").trim();
        classification = { ...classification, ...JSON.parse(raw) };
      } catch {
        // Keep defaults
      }
    }

    const messageToLead = classification.response || text.replace(/<classification>[\s\S]*?<\/classification>/, "").trim();

    // 8. Save lead message
    await supabase.from("setter_messages").insert({
      lead_id: lead.id,
      role: "lead",
      content: message,
      classification: classification.action,
    });

    // 9. Save setter response
    await supabase.from("setter_messages").insert({
      lead_id: lead.id,
      role: "setter",
      content: messageToLead,
    });

    // 10. Update lead status and data
    const updateData: Record<string, unknown> = {
      status: classification.status,
      last_message_at: new Date().toISOString(),
    };

    const ld = classification.lead_data as Record<string, unknown>;
    if (ld?.experience_years) updateData.experience_years = ld.experience_years;
    if (ld?.goal) updateData.training_goal = ld.goal;
    if (ld?.numbers) updateData.current_numbers = ld.numbers;
    if (classification.escalation_reason) updateData.escalation_reason = classification.escalation_reason;

    await supabase.from("setter_leads").update(updateData).eq("id", lead.id);

    return NextResponse.json({
      success: true,
      message_to_lead: messageToLead,
      action: classification.action,
      lead_status: classification.status,
      lead_id: lead.id,
      should_escalate: classification.action === "escalate",
    });
  } catch (err) {
    console.error("Setter process error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
