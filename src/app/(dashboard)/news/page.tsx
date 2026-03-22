"use client";

import { useState, useMemo } from "react";
import { NewsTopic, mockNews, topicConfig } from "@/lib/mock-news";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const allTopics: NewsTopic[] = ["tools", "research", "business"];

export default function NewsConsolidator() {
  const [selectedTopics, setSelectedTopics] = useState<NewsTopic[]>(allTopics);

  const filtered = useMemo(
    () => mockNews.filter((n) => selectedTopics.includes(n.topic)),
    [selectedTopics]
  );

  function toggleTopic(topic: NewsTopic) {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length === 1) return;
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  }

  const allSelected = selectedTopics.length === allTopics.length;

  function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    return `Hace ${days} dias`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          News Consolidator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Noticias de IA y marketing agregadas desde RSS feeds.
        </p>
      </div>

      {/* Topic filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedTopics(allTopics)}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            allSelected
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Todas
        </button>
        {allTopics.map((topic) => {
          const config = topicConfig[topic];
          const isActive = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? config.color
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {config.label}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} articulos
        </span>
      </div>

      {/* News cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const config = topicConfig[item.topic];
          return (
            <Card
              key={item.id}
              className="bg-card border-border hover:border-primary/30 transition-colors group"
            >
              <CardContent className="pt-5 pb-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {daysSince(item.date)}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                  {item.headline}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {item.source}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.date}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No hay noticias para los filtros seleccionados.
        </div>
      )}
    </div>
  );
}
