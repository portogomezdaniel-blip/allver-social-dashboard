"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dailyMetrics, topPosts, summaryStats } from "@/lib/mock-analytics";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { StatsCard } from "@/components/analytics/stats-card";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date("2026-02-19"),
    to: new Date("2026-03-21"),
  });

  const filteredMetrics = useMemo(() => {
    const fromStr = dateRange.from.toISOString().split("T")[0];
    const toStr = dateRange.to.toISOString().split("T")[0];
    return dailyMetrics.filter((d) => d.date >= fromStr && d.date <= toStr);
  }, [dateRange]);

  const filteredStats = useMemo(() => {
    if (filteredMetrics.length === 0) return summaryStats;
    return {
      totalImpressions: filteredMetrics.reduce(
        (sum, d) => sum + d.impressions,
        0
      ),
      avgEngagement:
        Math.round(
          (filteredMetrics.reduce((sum, d) => sum + d.engagementRate, 0) /
            filteredMetrics.length) *
            100
        ) / 100,
      currentFollowers: filteredMetrics[filteredMetrics.length - 1].followers,
      followerGrowth:
        filteredMetrics[filteredMetrics.length - 1].followers -
        filteredMetrics[0].followers,
    };
  }, [filteredMetrics]);

  const chartData = filteredMetrics.map((d) => ({
    ...d,
    label: format(new Date(d.date), "dd MMM", { locale: es }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Metricas de Instagram via Metricool
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Impresiones totales"
          value={filteredStats.totalImpressions.toLocaleString("es")}
          subtitle="En el periodo seleccionado"
        />
        <StatsCard
          title="Engagement promedio"
          value={`${filteredStats.avgEngagement}%`}
          subtitle="Tasa de interaccion"
        />
        <StatsCard
          title="Seguidores actuales"
          value={filteredStats.currentFollowers.toLocaleString("es")}
          subtitle={`${filteredStats.followerGrowth >= 0 ? "+" : ""}${filteredStats.followerGrowth} en el periodo`}
        />
        <StatsCard
          title="Posts top"
          value={topPosts.length.toString()}
          subtitle="Mejor rendimiento"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Impressions line chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impresiones diarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="impressionsGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="oklch(0.7 0.18 280)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="oklch(0.7 0.18 280)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.3 0.01 285)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.18 0.005 285)",
                      border: "1px solid oklch(0.3 0.01 285)",
                      borderRadius: "8px",
                      color: "#fafafa",
                      fontSize: 13,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="oklch(0.7 0.18 280)"
                    strokeWidth={2}
                    fill="url(#impressionsGrad)"
                    name="Impresiones"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement rate bar chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de engagement (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.3 0.01 285)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.18 0.005 285)",
                      border: "1px solid oklch(0.3 0.01 285)",
                      borderRadius: "8px",
                      color: "#fafafa",
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="engagementRate"
                    fill="oklch(0.65 0.15 200)"
                    radius={[4, 4, 0, 0]}
                    name="Engagement %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follower growth */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Crecimiento de seguidores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.3 0.01 285)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  domain={["dataMin - 20", "dataMax + 20"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.18 0.005 285)",
                    border: "1px solid oklch(0.3 0.01 285)",
                    borderRadius: "8px",
                    color: "#fafafa",
                    fontSize: 13,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke="oklch(0.7 0.15 150)"
                  strokeWidth={2}
                  dot={false}
                  name="Seguidores"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top performing posts */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Posts con mejor rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 pr-4 font-medium">Post</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-right py-3 px-4 font-medium">
                    Impresiones
                  </th>
                  <th className="text-right py-3 px-4 font-medium">Likes</th>
                  <th className="text-right py-3 px-4 font-medium">
                    Comentarios
                  </th>
                  <th className="text-right py-3 px-4 font-medium">Guardados</th>
                  <th className="text-right py-3 pl-4 font-medium">
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 pr-4 max-w-[280px] truncate text-foreground">
                      {post.caption}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {post.postType}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {post.impressions.toLocaleString("es")}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {post.likes}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {post.comments}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {post.saves}
                    </td>
                    <td className="py-3 pl-4 text-right text-primary font-medium">
                      {post.engagementRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
