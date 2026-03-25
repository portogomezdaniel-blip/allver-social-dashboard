"use client";

import { CalendarPost, platformConfig } from "@/lib/mock-calendar";

const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  posts: CalendarPost[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-first: Mon=0, Sun=6
  return day === 0 ? 6 : day - 1;
}

export function CalendarGrid({ year, month, posts }: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA");

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Fill remaining cells to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function getPostsForDay(day: number): CalendarPost[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter((p) => p.date === dateStr);
  }

  return (
    <div className="border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-medium text-muted-foreground border-b border-border"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="min-h-[100px] border-b border-r border-border bg-background/30 last:border-r-0"
              />
            );
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const dayPosts = getPostsForDay(day);

          return (
            <div
              key={day}
              className="min-h-[100px] border-b border-r border-border p-1.5 last:border-r-0 bg-background hover:bg-muted/20 transition-colors"
            >
              <span
                className={`inline-flex items-center justify-center text-xs w-6 h-6 rounded-full mb-1 ${
                  isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {day}
              </span>
              <div className="space-y-1">
                {dayPosts.map((post) => {
                  const config = platformConfig[post.platform];
                  return (
                    <div
                      key={post.id}
                      className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] leading-tight truncate cursor-default ${
                        post.status === "published"
                          ? "opacity-70"
                          : ""
                      } ${config.color}`}
                      title={`${post.title} — ${post.time} — ${post.status === "published" ? "Publicado" : "Programado"}`}
                    >
                      <span
                        className={`shrink-0 w-1.5 h-1.5 rounded-full ${config.dotColor}`}
                      />
                      <span className="truncate">{post.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
