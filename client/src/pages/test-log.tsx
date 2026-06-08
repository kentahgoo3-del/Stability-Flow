import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, User } from "lucide-react";
import { format } from "date-fns";

export default function TestLog() {
  const [search, setSearch] = useState("");
  const [filterAnalyst, setFilterAnalyst] = useState("all");
  const [filterFlag, setFilterFlag] = useState("all");

  const { data: log = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/test-log"] });

  const analysts = Array.from(new Set((log as any[]).map((r: any) => r.completedByName).filter(Boolean))).sort();

  const filtered = (log as any[]).filter((r: any) => {
    if (filterAnalyst !== "all" && r.completedByName !== filterAnalyst) return false;
    if (filterFlag === "oos" && r.oosOotFlag !== "OOS") return false;
    if (filterFlag === "oot" && r.oosOotFlag !== "OOT") return false;
    if (filterFlag === "flagged" && !r.oosOotFlag) return false;
    if (filterFlag === "clean" && r.oosOotFlag) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !(r.testName || "").toLowerCase().includes(s) &&
        !(r.product || "").toLowerCase().includes(s) &&
        !(r.batch || "").toLowerCase().includes(s) &&
        !(r.completedByName || "").toLowerCase().includes(s) &&
        !(r.timePointLabel || "").toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">Test Log</h2>
        <p className="text-sm text-muted-foreground">Complete record of every test completed, who did it, and any OOS/OOT flags</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search test, product, batch, analyst…"
          className="h-9 max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-testlog"
        />
        <Select value={filterAnalyst} onValueChange={setFilterAnalyst}>
          <SelectTrigger className="h-9 w-44" data-testid="select-filter-analyst">
            <SelectValue placeholder="All analysts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All analysts</SelectItem>
            {analysts.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFlag} onValueChange={setFilterFlag}>
          <SelectTrigger className="h-9 w-36" data-testid="select-filter-flag">
            <SelectValue placeholder="All results" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="flagged">Flagged only</SelectItem>
            <SelectItem value="oos">OOS only</SelectItem>
            <SelectItem value="oot">OOT only</SelectItem>
            <SelectItem value="clean">No flag</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-1">{filtered.length} entries</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No test completions found</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium text-xs">Product</th>
                    <th className="px-3 py-2 font-medium text-xs">Batch</th>
                    <th className="px-3 py-2 font-medium text-xs">Condition</th>
                    <th className="px-3 py-2 font-medium text-xs">Time Point</th>
                    <th className="px-3 py-2 font-medium text-xs">Test</th>
                    <th className="px-3 py-2 font-medium text-xs">Flag</th>
                    <th className="px-3 py-2 font-medium text-xs">Note</th>
                    <th className="px-3 py-2 font-medium text-xs">Analyst</th>
                    <th className="px-3 py-2 font-medium text-xs">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any) => (
                    <tr
                      key={r.id}
                      className={`border-b hover:bg-muted/30 transition-colors ${r.oosOotFlag === "OOS" ? "bg-red-50/40 dark:bg-red-950/10" : r.oosOotFlag === "OOT" ? "bg-orange-50/40 dark:bg-orange-950/10" : ""}`}
                      data-testid={`row-testlog-${r.id}`}
                    >
                      <td className="px-3 py-2 font-medium">{r.product || "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.batch || "—"}</td>
                      <td className="px-3 py-2 text-xs">{r.conditionCode || "—"}</td>
                      <td className="px-3 py-2 font-medium">{r.timePointLabel || "—"}</td>
                      <td className="px-3 py-2 font-medium">{r.testName}</td>
                      <td className="px-3 py-2">
                        {r.oosOotFlag ? (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${r.oosOotFlag === "OOS" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"}`}>
                            {r.oosOotFlag}
                          </span>
                        ) : <span className="text-xs text-green-600 dark:text-green-400 font-medium">Pass</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground italic max-w-xs truncate" title={r.oosOotNote || ""}>{r.oosOotNote || "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-xs font-medium">{r.completedByName || "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {r.completedAt ? format(new Date(r.completedAt), "dd MMM yyyy HH:mm") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
