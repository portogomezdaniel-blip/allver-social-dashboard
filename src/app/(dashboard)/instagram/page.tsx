"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PostStatus, PostType } from "@/lib/types";
import type { Platform } from "@/lib/mock-calendar";
import { DbPost, fetchPosts, createPost, updatePost, deletePost } from "@/lib/supabase/posts";
import { PostCard } from "@/components/instagram/post-card";
import { NewPostDialog } from "@/components/instagram/new-post-dialog";
import { Toast } from "@/components/ui/Toast";
import { useLocale } from "@/lib/locale-context";

const STATUS_TABS: { value: PostStatus; label_es: string; label_en: string; empty_es: string; empty_en: string }[] = [
  { value: "scheduled", label_es: "Programados", label_en: "Scheduled", empty_es: "Contenido programado aparecera aqui", empty_en: "Scheduled content will appear here" },
  { value: "draft", label_es: "Borradores", label_en: "Drafts", empty_es: "Tus ideas en proceso aparecen aqui", empty_en: "Your drafts will appear here" },
  { value: "published", label_es: "Publicados", label_en: "Published", empty_es: "Marca contenido como publicado para trackear tu output", empty_en: "Mark content as published to track output" },
  { value: "backlog", label_es: "Backlog", label_en: "Backlog", empty_es: "Tu archivo de contenido esta limpio", empty_en: "Your content archive is clean" },
];
const TYPE_FILTERS: { value: PostType | "all"; label: string; color: string }[] = [
  { value: "all", label: "Todos", color: "var(--text-muted)" },
  { value: "reel", label: "Reel", color: "var(--red)" },
  { value: "carousel", label: "Carrusel", color: "var(--olive)" },
  { value: "single", label: "Imagen", color: "var(--blue)" },
  { value: "story", label: "Story", color: "var(--amber)" },
];
const SORT_OPTIONS = [
  { value: "sched_asc", label: "Fecha prog. (prox.)" },
  { value: "sched_desc", label: "Fecha prog. (lejos)" },
  { value: "created_desc", label: "Creado (reciente)" },
  { value: "created_asc", label: "Creado (antiguo)" },
  { value: "alpha", label: "A → Z" },
];

function isWithin24h(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr + "T23:59:59").getTime() - Date.now();
  return diff >= 0 && diff <= 86400000;
}

export default function InstagramManager() {
  const { t, locale } = useLocale();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PostStatus>("scheduled");
  const [typeFilter, setTypeFilter] = useState<PostType | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("sched_asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editPost, setEditPost] = useState<DbPost | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editType, setEditType] = useState<PostType>("reel");
  const [editStatus, setEditStatus] = useState<PostStatus>("draft");
  const [editDate, setEditDate] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const handleToastDone = useCallback(() => setToast(null), []);

  useEffect(() => { fetchPosts().then(setPosts).catch(() => {}).finally(() => setLoading(false)); }, []);

  // Counts by status (real-time)
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of STATUS_TABS) c[s.value] = posts.filter((p) => p.status === s.value).length;
    return c;
  }, [posts]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = posts.filter((p) => p.status === activeTab);
    if (typeFilter !== "all") result = result.filter((p) => p.post_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.caption.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      if (sort === "sched_asc") return (a.scheduled_date || "9").localeCompare(b.scheduled_date || "9");
      if (sort === "sched_desc") return (b.scheduled_date || "0").localeCompare(a.scheduled_date || "0");
      if (sort === "created_desc") return b.created_at.localeCompare(a.created_at);
      if (sort === "created_asc") return a.created_at.localeCompare(b.created_at);
      if (sort === "alpha") return a.caption.localeCompare(b.caption);
      return 0;
    });
    return result;
  }, [posts, activeTab, typeFilter, search, sort]);

  // ─── Handlers ──────────────────────────────────────────
  async function handleAddPost(post: { caption: string; postType: PostType; status: PostStatus; scheduledDate: string | null; platform: Platform }) {
    try {
      const np = await createPost({ caption: post.caption, post_type: post.postType, status: post.status, scheduled_date: post.scheduledDate, platform: post.platform });
      setPosts((prev) => [np, ...prev]);
      setToast("Post creado");
    } catch { setToast("Error al crear"); }
  }

  async function handleUpdate(id: string, updates: Partial<{ caption: string; post_type: PostType; status: PostStatus; scheduled_date: string | null }>) {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } as DbPost : p));
    try { await updatePost(id, updates); setToast("Actualizado"); }
    catch { setToast("Error al actualizar"); }
  }

  async function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    try { await deletePost(id); setToast("Eliminado"); }
    catch { setToast("Error al eliminar"); }
  }

  async function handleDuplicate(id: string) {
    const orig = posts.find((p) => p.id === id);
    if (!orig) return;
    try {
      const dup = await createPost({ caption: orig.caption, post_type: orig.post_type, status: "draft", scheduled_date: null, platform: orig.platform });
      setPosts((prev) => [dup, ...prev]);
      setToast("Duplicado como borrador");
    } catch { setToast("Error al duplicar"); }
  }

  function handleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function handleBulkStatus(newStatus: PostStatus) {
    const ids = [...selected];
    setPosts((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, status: newStatus } : p));
    setSelected(new Set());
    for (const id of ids) { updatePost(id, { status: newStatus }).catch(() => {}); }
    setToast(`${ids.length} movidos a ${newStatus}`);
  }

  async function handleBulkDelete() {
    const ids = [...selected];
    setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelected(new Set());
    for (const id of ids) { deletePost(id).catch(() => {}); }
    setToast(`${ids.length} eliminados`);
  }

  function openEdit(id: string) {
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    setEditPost(p);
    setEditCaption(p.caption);
    setEditType(p.post_type);
    setEditStatus(p.status);
    setEditDate(p.scheduled_date || "");
  }

  async function saveEdit() {
    if (!editPost) return;
    await handleUpdate(editPost.id, { caption: editCaption, post_type: editType, status: editStatus, scheduled_date: editDate || null });
    setEditPost(null);
  }

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] md:text-[22px]" style={{ fontFamily: "var(--font-display)" }}>Tu contenido</h1>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{posts.length} posts total</p>
        </div>
        <NewPostDialog onAdd={handleAddPost} />
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-4 gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setSelected(new Set()); }}
            className="rounded-[6px] p-2 text-center transition-colors"
            style={{
              background: activeTab === tab.value ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              border: activeTab === tab.value ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span className="block text-[16px]" style={{ fontFamily: "var(--font-display)", color: activeTab === tab.value ? "white" : "var(--text-secondary)" }}>
              {counts[tab.value] || 0}
            </span>
            <span className="block text-[7px]" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>
              {locale === "en" ? tab.label_en : tab.label_es}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === "en" ? "Search posts..." : "Buscar posts..."}
          className="flex-1 text-[11px] px-3 py-2 rounded-[6px] text-white placeholder:text-[var(--text-ghost)] focus:outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-[9px] px-2 py-2 rounded-[6px] appearance-none cursor-pointer"
          style={{ fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)" }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className="text-[8px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              background: typeFilter === f.value ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              color: typeFilter === f.value ? f.color : "var(--text-ghost)",
              border: typeFilter === f.value ? `1px solid ${f.color}30` : "1px solid transparent",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Post grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[120px] rounded-[8px] animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={{ id: post.id, caption: post.caption, postType: post.post_type, status: post.status, scheduledDate: post.scheduled_date, createdAt: post.created_at.split("T")[0] }}
              isSelected={selected.has(post.id)}
              isProximity={isWithin24h(post.scheduled_date)}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onDuplicate={handleDuplicate}
              onClick={openEdit}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[28px] mb-2" style={{ color: "var(--text-ghost)" }}>
            {activeTab === "scheduled" ? "📅" : activeTab === "draft" ? "📝" : activeTab === "published" ? "✅" : "📦"}
          </p>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {locale === "en"
              ? STATUS_TABS.find((s) => s.value === activeTab)?.empty_en
              : STATUS_TABS.find((s) => s.value === activeTab)?.empty_es}
          </p>
        </div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-[80] flex items-center justify-between gap-3 px-4 py-3 rounded-[8px]"
          style={{ background: "rgba(30,32,28,0.96)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--olive)" }}>
            {selected.size} seleccionados
          </span>
          <div className="flex items-center gap-1.5">
            <select
              onChange={(e) => { if (e.target.value) handleBulkStatus(e.target.value as PostStatus); e.target.value = ""; }}
              className="text-[8px] px-2 py-1.5 rounded-[5px] appearance-none cursor-pointer"
              style={{ fontFamily: "var(--font-mono)", background: "var(--olive-bg)", color: "var(--olive)", border: "1px solid rgba(122,140,101,0.3)" }}
              defaultValue=""
            >
              <option value="" disabled>Mover a…</option>
              {STATUS_TABS.map((s) => <option key={s.value} value={s.value}>{locale === "en" ? s.label_en : s.label_es}</option>)}
            </select>
            <button
              onClick={handleBulkDelete}
              className="text-[8px] px-2 py-1.5 rounded-[5px]"
              style={{ fontFamily: "var(--font-mono)", background: "var(--red-bg)", color: "var(--red)" }}
            >
              Eliminar
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-[8px] px-2 py-1.5 rounded-[5px]"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Edit drawer/modal */}
      {editPost && (
        <>
          <div className="fixed inset-0 z-[90]" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setEditPost(null)} />
          <div
            className="fixed top-0 right-0 bottom-0 z-[95] w-full md:w-[400px] flex flex-col overflow-y-auto"
            style={{ background: "rgba(50,53,46,0.98)", backdropFilter: "blur(24px)", borderLeft: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>Editar post</span>
              <button onClick={() => setEditPost(null)} className="text-[14px]" style={{ color: "var(--text-ghost)" }}>✕</button>
            </div>

            <div className="flex-1 p-4 space-y-4">
              {/* Caption */}
              <div>
                <label className="block mb-1" style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>Caption</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={6}
                  className="w-full text-[12px] px-3 py-2 rounded-[6px] text-white placeholder:text-[var(--text-ghost)] focus:outline-none resize-y"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block mb-1" style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>Tipo</label>
                <div className="flex gap-1">
                  {(["reel", "carousel", "single", "story"] as PostType[]).map((pt) => (
                    <button
                      key={pt}
                      onClick={() => setEditType(pt)}
                      className="text-[8px] px-2.5 py-1.5 rounded-[5px]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: editType === pt ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                        color: editType === pt ? "white" : "var(--text-muted)",
                        border: editType === pt ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block mb-1" style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>Estado</label>
                <div className="flex gap-1">
                  {(["scheduled", "draft", "published", "backlog"] as PostStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setEditStatus(s)}
                      className="text-[8px] px-2.5 py-1.5 rounded-[5px]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: editStatus === s ? "var(--olive-bg)" : "rgba(255,255,255,0.04)",
                        color: editStatus === s ? "var(--olive)" : "var(--text-muted)",
                        border: editStatus === s ? "1px solid rgba(122,140,101,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block mb-1" style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-ghost)" }}>Fecha programada</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full text-[11px] px-3 py-2 rounded-[6px] text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={saveEdit}
                className="flex-1 text-[9px] py-2 rounded-[6px] text-white"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "var(--olive-dark)" }}
              >
                Guardar
              </button>
              <button
                onClick={() => setEditPost(null)}
                className="text-[9px] px-4 py-2 rounded-[6px]"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

      <Toast message={toast} onDone={handleToastDone} />
    </div>
  );
}
