import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicRoutineClient from "./client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProgram(slug: string) {
  const { data, error } = await supabase
    .from("client_programs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgram(slug);

  if (!program) {
    return { title: "Rutina no encontrada" };
  }

  const title = `Rutina de ${program.client_name || "Cliente"}`;
  const description = program.period_label
    ? `${program.period_label} · Iron Cave Gym`
    : "Programa de entrenamiento personalizado · Iron Cave Gym";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "FTP by LLVR",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicRoutinePage({ params }: Props) {
  const { slug } = await params;
  const program = await getProgram(slug);

  if (!program) notFound();

  return <PublicRoutineClient program={program} />;
}
