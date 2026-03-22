"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Competitor,
  CompetitorPlatform,
  mockCompetitors,
  platformLabels,
} from "@/lib/mock-competitors";
import {
  DbCompetitor,
  fetchCompetitors,
  createCompetitor,
  deleteCompetitor,
} from "@/lib/supabase/competitors";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlowButton } from "@/components/ui/glow-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey =
  | "followers"
  | "followersChange"
  | "avgEngagement"
  | "postsPerWeek";

const platformDotColors: Record<CompetitorPlatform, string> = {
  instagram: "bg-purple-400",
  youtube: "bg-red-400",
  tiktok: "bg-cyan-400",
};

const platformBadgeColors: Record<CompetitorPlatform, string> = {
  instagram: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  youtube: "bg-red-500/20 text-red-300 border-red-500/30",
  tiktok: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

function dbToLocal(db: DbCompetitor): Competitor {
  return {
    id: db.id,
    handle: db.handle,
    name: db.name,
    platform: db.platform,
    followers: db.followers,
    followersChange: db.followers_change,
    avgEngagement: db.avg_engagement,
    postsPerWeek: db.posts_per_week,
    recentPosts: [],
  };
}

export default function CompetitorTracker() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] =
    useState<CompetitorPlatform>("instagram");

  const loadCompetitors = useCallback(async () => {
    try {
      const data = await fetchCompetitors();
      setCompetitors(
        data.length > 0 ? data.map(dbToLocal) : mockCompetitors
      );
    } catch {
      setCompetitors(mockCompetitors);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  const sorted = useMemo(() => {
    return [...competitors].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    });
  }, [competitors, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  async function handleAdd() {
    if (!newHandle.trim() || !newName.trim()) return;
    try {
      const db = await createCompetitor({
        handle: newHandle,
        name: newName,
        platform: newPlatform,
      });
      setCompetitors((prev) => [dbToLocal(db), ...prev]);
      setNewHandle("");
      setNewName("");
      setNewPlatform("instagram");
      setDialogOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error agregando competidor";
      setError(message);
    }
  }

  async function handleRemove(id: string) {
    try {
      await deleteCompetitor(id);
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error eliminando competidor";
      setError(message);
    }
  }

  function SortHeader({
    label,
    field,
  }: {
    label: string;
    field: SortKey;
  }) {
    const isActive = sortKey === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {isActive && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`transition-transform ${sortAsc ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando competidores...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Competitor Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitorea la actividad y crecimiento de tus competidores en redes
            sociales.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="relative flex h-min w-fit flex-col items-center overflow-visible rounded-full border border-[#1E2916] bg-[#0D1008] p-px transition-all duration-300 hover:border-[#4A7C2F]">
            <span className="z-10 w-auto rounded-full bg-[#131A0E] px-6 py-2.5 text-xs tracking-[0.15em] uppercase text-[#C8C8C8] transition-colors duration-300 hover:text-[#6AAF3D]">
              + Agregar competidor
            </span>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Nuevo competidor
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="comp-name">Nombre</Label>
                <Input
                  id="comp-name"
                  placeholder="Nombre de la cuenta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comp-handle">Handle</Label>
                <Input
                  id="comp-handle"
                  placeholder="@usuario"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select
                  value={newPlatform}
                  onValueChange={(v) =>
                    setNewPlatform(v as CompetitorPlatform)
                  }
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <GlowButton
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </GlowButton>
                <GlowButton
                  onClick={handleAdd}
                  disabled={!newHandle.trim() || !newName.trim()}
                >
                  Agregar
                </GlowButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Competidores rastreados
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {competitors.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Mayor engagement
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {competitors.length > 0
                ? `${Math.max(...competitors.map((c) => c.avgEngagement))}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Mayor crecimiento (30d)
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {competitors.length > 0
                ? `+${Math.max(...competitors.map((c) => c.followersChange)).toLocaleString("es")}`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sortable table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 pl-4 pr-2 font-medium">
                    Competidor
                  </th>
                  <th className="text-left py-3 px-2 font-medium">
                    Plataforma
                  </th>
                  <th className="text-right py-3 px-2 font-medium">
                    <SortHeader label="Seguidores" field="followers" />
                  </th>
                  <th className="text-right py-3 px-2 font-medium">
                    <SortHeader label="Crecimiento 30d" field="followersChange" />
                  </th>
                  <th className="text-right py-3 px-2 font-medium">
                    <SortHeader label="Engagement" field="avgEngagement" />
                  </th>
                  <th className="text-right py-3 px-2 font-medium">
                    <SortHeader label="Posts/sem" field="postsPerWeek" />
                  </th>
                  <th className="text-right py-3 pl-2 pr-4 font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((comp) => (
                  <>
                    <tr
                      key={comp.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === comp.id ? null : comp.id
                        )
                      }
                    >
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${platformDotColors[comp.platform]}`}
                          />
                          <div>
                            <p className="text-foreground font-medium">
                              {comp.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {comp.handle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className={platformBadgeColors[comp.platform]}
                        >
                          {platformLabels[comp.platform]}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-foreground">
                        {comp.followers.toLocaleString("es")}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={
                            comp.followersChange >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {comp.followersChange >= 0 ? "+" : ""}
                          {comp.followersChange.toLocaleString("es")}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-foreground">
                        {comp.avgEngagement}%
                      </td>
                      <td className="py-3 px-2 text-right text-foreground">
                        {comp.postsPerWeek}
                      </td>
                      <td className="py-3 pl-2 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <GlowButton
                            variant="danger"
                            className="px-4 py-1 text-[10px]"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleRemove(comp.id);
                            }}
                          >
                            Quitar
                          </GlowButton>
                        </div>
                      </td>
                    </tr>
                    {expandedId === comp.id && (
                      <tr key={`${comp.id}-expanded`}>
                        <td
                          colSpan={7}
                          className="bg-muted/10 px-4 py-3 border-b border-border/50"
                        >
                          <p className="text-xs text-muted-foreground mb-2 font-medium">
                            Posts recientes de {comp.handle}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {comp.recentPosts.map((post, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-border bg-card p-3"
                              >
                                <p className="text-sm text-foreground leading-snug mb-2">
                                  {post.caption}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{post.likes.toLocaleString("es")} likes</span>
                                  <span>{post.comments} comentarios</span>
                                  <span className="ml-auto">{post.date}</span>
                                </div>
                              </div>
                            ))}
                            {comp.recentPosts.length === 0 && (
                              <p className="text-sm text-muted-foreground col-span-3">
                                Sin datos de posts aun. Los datos se sincronizaran automaticamente.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
