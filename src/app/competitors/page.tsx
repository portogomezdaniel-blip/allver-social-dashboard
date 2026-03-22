"use client";

import { useState, useMemo } from "react";
import {
  Competitor,
  CompetitorPlatform,
  mockCompetitors,
  platformLabels,
} from "@/lib/mock-competitors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const sortLabels: Record<SortKey, string> = {
  followers: "Seguidores",
  followersChange: "Crecimiento",
  avgEngagement: "Engagement",
  postsPerWeek: "Frecuencia",
};

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

export default function CompetitorTracker() {
  const [competitors, setCompetitors] =
    useState<Competitor[]>(mockCompetitors);
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] =
    useState<CompetitorPlatform>("instagram");

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

  function handleAdd() {
    if (!newHandle.trim() || !newName.trim()) return;
    const comp: Competitor = {
      id: crypto.randomUUID(),
      handle: newHandle.startsWith("@") ? newHandle : `@${newHandle}`,
      name: newName,
      platform: newPlatform,
      followers: 0,
      followersChange: 0,
      avgEngagement: 0,
      postsPerWeek: 0,
      recentPosts: [],
    };
    setCompetitors((prev) => [...prev, comp]);
    setNewHandle("");
    setNewName("");
    setNewPlatform("instagram");
    setDialogOpen(false);
  }

  function handleRemove(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
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
          <DialogTrigger className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            + Agregar competidor
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
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!newHandle.trim() || !newName.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(
                                expandedId === comp.id ? null : comp.id
                              );
                            }}
                          >
                            {expandedId === comp.id ? "Cerrar" : "Ver posts"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(comp.id);
                            }}
                          >
                            Quitar
                          </Button>
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
