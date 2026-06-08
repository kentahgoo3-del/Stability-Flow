import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from "recharts";
import { BarChart3, TrendingUp, TrendingDown, Activity, FlaskConical } from "lucide-react";
import { useState } from "react";
import type { StabilityStudy, TestResult, TimePoint } from "@shared/schema";

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function TrendChart({ studyId }: { studyId: string }) {
  const { data: results = [], isLoading } = useQuery<TestResult[]>({
    queryKey: ["/api/results", studyId],
    enabled: !!studyId,
  });
  const { data: timePoints = [] } = useQuery<TimePoint[]>({
    queryKey: ["/api/time-points", studyId],
    enabled: !!studyId,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!results.length) return (
    <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
      No results available for trend analysis
    </div>
  );

  // Group results by test name and time point
  const testNames = [...new Set(results.map(r => r.testSpecId).filter(Boolean))];
  const tpMap = new Map(timePoints.map(tp => [tp.id, tp]));

  // Build trend data for each test (simplified - take first few results)
  const uniqueTests: Record<string, TestResult[]> = {};
  results.forEach(r => {
    if (r.testSpecId && r.value !== null) {
      if (!uniqueTests[r.testSpecId]) uniqueTests[r.testSpecId] = [];
      uniqueTests[r.testSpecId].push(r);
    }
  });

  // For demo purposes, build time-based data
  const chartData = timePoints
    .filter(tp => tp.status === "completed")
    .map(tp => {
      const tpResults = results.filter(r => r.timePointId === tp.id && r.value !== null);
      const point: any = { name: tp.label };
      tpResults.forEach(r => {
        if (r.testSpecId) point[r.testSpecId.slice(-8)] = r.value;
      });
      return point;
    })
    .filter(d => Object.keys(d).length > 1);

  if (!chartData.length) return (
    <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
      Complete more time points to see trend data
    </div>
  );

  const lines = Object.keys(chartData[0] ?? {}).filter(k => k !== "name");

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
        {lines.map((l, i) => (
          <Line key={l} type="monotone" dataKey={l} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Analytics() {
  const [selectedStudy, setSelectedStudy] = useState<string>("");

  const { data: studies = [], isLoading: loadingStudies } = useQuery<StabilityStudy[]>({ queryKey: ["/api/studies"] });
  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });
  const { data: allResults = [] } = useQuery<TestResult[]>({ queryKey: ["/api/results"] });
  const { data: allTimePoints = [] } = useQuery<TimePoint[]>({ queryKey: ["/api/time-points"] });

  const resultsByStatus = [
    { name: "Passed", value: allResults.filter(r => r.status === "passed").length, color: "hsl(var(--chart-3))" },
    { name: "OOS", value: allResults.filter(r => r.status === "oos_suspected").length, color: "hsl(var(--destructive))" },
    { name: "OOT", value: allResults.filter(r => r.status === "oot_suspected").length, color: "hsl(var(--chart-4))" },
    { name: "Pending", value: allResults.filter(r => r.status === "pending").length, color: "hsl(var(--muted-foreground))" },
  ].filter(d => d.value > 0);

  const timePointsByStatus = [
    { name: "Completed", count: allTimePoints.filter(tp => tp.status === "completed").length },
    { name: "In Progress", count: allTimePoints.filter(tp => tp.status === "in_progress").length },
    { name: "Pending", count: allTimePoints.filter(tp => tp.status === "pending").length },
    { name: "Overdue", count: allTimePoints.filter(tp => tp.status === "overdue" || (tp.status === "pending" && new Date(tp.plannedDate) < new Date())).length },
  ];

  const studyTypeData = Object.entries(
    studies.reduce((acc, s) => { acc[s.studyType] = (acc[s.studyType] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name: name.replace("_", " "), count }));

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">Analytics & Reporting</h2>
        <p className="text-sm text-muted-foreground">Quality intelligence and trend analysis</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Results", value: allResults.length, icon: Activity, color: "text-primary" },
          { label: "Pass Rate", value: `${allResults.length ? Math.round(allResults.filter(r => r.status === "passed").length / allResults.length * 100) : 0}%`, icon: TrendingUp, color: "text-green-500" },
          { label: "OOS Events", value: allResults.filter(r => r.status === "oos_suspected").length, icon: TrendingDown, color: "text-destructive" },
          { label: "Studies Active", value: studies.filter(s => s.status === "active").length, icon: FlaskConical, color: "text-primary" },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Results by Status (Pie) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Results by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {resultsByStatus.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No results yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={resultsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {resultsByStatus.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {resultsByStatus.map(item => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-bold text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Points by Status (Bar) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Time Point Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timePointsByStatus} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {timePointsByStatus.map((entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Studies by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Studies by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={studyTypeData} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Result Trend */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">Result Trend by Study</CardTitle>
            <Select value={selectedStudy} onValueChange={setSelectedStudy}>
              <SelectTrigger className="w-44 h-7 text-xs" data-testid="select-analytics-study">
                <SelectValue placeholder="Select study" />
              </SelectTrigger>
              <SelectContent>
                {studies.filter(s => s.status === "active").map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.studyNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {selectedStudy ? (
              <TrendChart studyId={selectedStudy} />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Select a study to view trends
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
