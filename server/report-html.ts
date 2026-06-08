const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(d: any): string {
  if (!d) return "\u2014";
  try {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,"0")} ${MONTHS[dt.getMonth()].slice(0,3)} ${dt.getFullYear()}`;
  } catch { return "\u2014"; }
}
function fmtTs(d: any): string {
  if (!d) return "\u2014";
  try {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,"0")} ${MONTHS[dt.getMonth()].slice(0,3)} ${dt.getFullYear()}, ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
  } catch { return "\u2014"; }
}
function daysDiff(a: Date, b: Date): number {
  return Math.max(0, Math.floor((b.getTime()-a.getTime())/86400000));
}
function statusLabel(s: string): string {
  return ({completed:"Completed",in_progress:"In Progress",overdue:"Overdue",pending:"Pending"}[s])||s;
}
function statusColor(s: string): string {
  return ({completed:"#15803d",in_progress:"#b45309",overdue:"#b91c1c",pending:"#6b7280"}[s])||"#6b7280";
}
function esc(s: any): string {
  if (s==null) return "";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function secHead(num: number, title: string, badge?: string): string {
  return `<div class="sh"><span class="sn">${num}</span><span class="st">${esc(title)}</span>${badge?`<span class="sb"> &nbsp;(${esc(badge)})</span>`:""}</div>`;
}
function narr(text: string|null|undefined, placeholder: string): string {
  const t = (text&&text.trim())?esc(text):`<span style="color:#9ca3af">${esc(placeholder)}</span>`;
  return `<div class="narr">${t.replace(/\n/g,"<br>")}</div>`;
}

function statRow(s: any): string {
  const cards=[
    ["Total Due",   s.total??0,        "#1e3a5f"],
    ["Completed",   s.completed??0,    "#15803d"],
    ["On Time",     s.pulledOnTime??0, "#065f46"],
    ["In Progress", s.inProgress??0,   "#b45309"],
    ["Overdue",     s.overdue??0,      "#b91c1c"],
    ["OOS / OOT",   s.oosOotCount??0,  "#991b1b"],
  ] as [string,number,string][];
  return `<table class="stat-tbl"><tr>${cards.map(([l,v,c])=>`
    <td class="stat-td">
      <div class="stat-v" style="color:${c}">${v}</div>
      <div class="stat-l">${esc(l)}</div>
    </td>`).join("")}</tr></table>`;
}

function samplesTable(items: any[]): string {
  if (!items.length) return `<div class="empty">No samples scheduled for this period.</div>`;
  const rows = items.map((r,i)=>{
    const tc = r.testsTotal>0
      ? `<b style="color:${r.testsCompleted===r.testsTotal?"#15803d":r.testsCompleted>0?"#b45309":"#9ca3af"}">${r.testsCompleted}/${r.testsTotal}</b>`
      : `<span style="color:#d1d5db">\u2014</span>`;
    return `<tr${i%2===1?' class="alt"':''}>
      <td class="mono">${esc(r.studyNumber||"\u2014")}</td>
      <td>${esc(r.product)}</td>
      <td class="mono">${esc(r.batch)}</td>
      <td>${esc(r.conditionCode||"\u2014")}</td>
      <td>${esc(r.label)}</td>
      <td>${fmt(r.plannedDate)}</td>
      <td>${fmt(r.actualDate)}</td>
      <td class="c">${tc}</td>
      <td style="color:${statusColor(r.status)};font-weight:600">${statusLabel(r.status)}</td>
    </tr>`;
  }).join("");
  return `<table class="data-tbl"><colgroup>
    <col style="width:11%"><col style="width:20%"><col style="width:9%">
    <col style="width:10%"><col style="width:8%"><col style="width:10%">
    <col style="width:10%"><col style="width:6%"><col style="width:11%">
  </colgroup>
  <thead><tr class="th-default">
    <th>Study No</th><th>Product</th><th>Batch</th><th>Condition</th>
    <th>T-Point</th><th>Planned</th><th>Actual</th><th>Tests</th><th>Status</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function oosTable(items: any[]): string {
  if (!items.length) return `<div class="empty ok">&#10003;&nbsp; No OOS or OOT results for this period.</div>`;
  const rows = items.map((r,i)=>{
    const fc = r.oosOotFlag==="OOS"?"#b91c1c":"#c2410c";
    return `<tr${i%2===1?' class="alt"':''}>
      <td style="color:${fc};font-weight:700">${esc(r.oosOotFlag)}</td>
      <td class="mono">${esc(r.studyNumber||"\u2014")}</td>
      <td>${esc(r.product)}</td>
      <td class="mono">${esc(r.batch)}</td>
      <td>${esc(r.label)}</td>
      <td>${esc(r.testName)}</td>
      <td style="font-style:italic">${esc(r.oosOotNote||"\u2014")}</td>
      <td>${esc(r.completedByName||"\u2014")}</td>
      <td>${fmt(r.completedAt)}</td>
    </tr>`;
  }).join("");
  return `<table class="data-tbl"><colgroup>
    <col style="width:5%"><col style="width:10%"><col style="width:16%"><col style="width:8%">
    <col style="width:7%"><col style="width:12%"><col style="width:24%">
    <col style="width:10%"><col style="width:8%">
  </colgroup>
  <thead><tr class="th-oos">
    <th>Flag</th><th>Study No</th><th>Product</th><th>Batch</th>
    <th>T-Point</th><th>Test</th><th>Failure Note</th><th>Analyst</th><th>Date</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function overdueTable(items: any[], now: Date): string {
  if (!items.length) return `<div class="empty ok">&#10003;&nbsp; No overdue samples for this period.</div>`;
  const rows = items.map((r,i)=>{
    const late = daysDiff(new Date(r.plannedDate), now);
    const lc = late>30?"#b91c1c":late>14?"#b45309":"#ca8a04";
    const lateStarted = r.wasOverdue && (r.status === "in_progress" || r.status === "completed");
    const statusCell = lateStarted
      ? `<span style="color:${statusColor(r.status)};font-weight:600">${statusLabel(r.status)}</span>&nbsp;<span style="background:#fef3c7;color:#92400e;font-size:7.5pt;padding:1px 4px;border-radius:3px;border:1px solid #fcd34d;font-weight:700;white-space:nowrap">Late Start</span>`
      : `<span style="color:${statusColor(r.status)};font-weight:600">${statusLabel(r.status)}</span>`;
    return `<tr${i%2===1?' class="alt"':''}>
      <td class="mono">${esc(r.studyNumber||"\u2014")}</td>
      <td>${esc(r.product)}</td>
      <td class="mono">${esc(r.batch)}</td>
      <td>${esc(r.conditionCode||"\u2014")}</td>
      <td>${esc(r.label)}</td>
      <td>${fmt(r.plannedDate)}</td>
      <td style="color:${lc};font-weight:700">${late>0?`${late}d`:"&lt;1d"}</td>
      <td>${statusCell}</td>
    </tr>`;
  }).join("");
  return `<table class="data-tbl"><colgroup>
    <col style="width:12%"><col style="width:22%"><col style="width:10%">
    <col style="width:11%"><col style="width:9%"><col style="width:11%">
    <col style="width:10%"><col style="width:15%">
  </colgroup>
  <thead><tr class="th-overdue">
    <th>Study No</th><th>Product</th><th>Batch</th><th>Condition</th>
    <th>T-Point</th><th>Planned Date</th><th>Days Late</th><th>Status</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function sigCell(label: string, so: any): string {
  const signed = !!so;
  return `<td class="sig-td${signed?" sig-signed":""}">
    <div class="sig-role">${esc(label)}</div>
    ${signed?`
      <div class="sig-name">${esc(so.signedByName)}</div>
      <div class="sig-meta">${fmtTs(so.signedAt)}</div>
      ${so.comment?`<div class="sig-comment">&ldquo;${esc(so.comment)}&rdquo;</div>`:""}
    `:`
      <div class="sig-empty">Awaiting signature&hellip;</div>
      <div class="sig-line">Signature: ________________________</div>
      <div class="sig-line">Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;________________________</div>
    `}
  </td>`;
}

export function generateReportHTML(data: any, year: number, month: number): string {
  const now = new Date();
  const periodLabel = `${MONTHS[month-1]} ${year}`;
  const docNumber   = `SF-MSR-${year}-${String(month).padStart(2,"0")}`;

  const DEF_OBJ  = "To review and document all pharmaceutical stability samples scheduled for the reporting period, ensuring samples have been pulled and tested in accordance with the approved stability protocol and ICH guidelines.";
  const DEF_SCP  = "This report covers all stability studies registered in StabilityFlow that have time points falling within the reporting period. It includes assessment of sample compliance, identification of overdue samples, and recording of any out-of-specification (OOS) or out-of-trend (OOT) results observed.";
  const DEF_DIS  = "Summarise the key observations for the period. Comment on any overdue samples and their justification, OOS/OOT results and associated investigations, and corrective actions taken or planned.";
  const DEF_CON  = "All stability samples due for the reporting period have been reviewed. Overdue and anomalous results have been documented and are subject to investigation as appropriate.";

  const notes  = data.notes || {};
  const headSO = (data.signoffs||[]).find((s:any)=>s.roleLabel==="section_head");
  const mgrSO  = (data.signoffs||[]).find((s:any)=>s.roleLabel==="manager");
  const both   = !!(headSO&&mgrSO);
  const sum    = data.summary || {};
  const items:any[]   = data.items || [];
  const oosItems:any[]= data.oosOotItems || [];
  const ovdItems:any[]= data.overdueItems || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(docNumber)} \u2014 ${esc(periodLabel)}</title>
<style>
@page {
  size: A4 portrait;
  margin: 14mm 18mm 16mm 18mm;
}
*,*::before,*::after {
  box-sizing: border-box; margin:0; padding:0;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
html {
  background: #d1d5db;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  color: #111;
  background: #fff;
  line-height: 1.4;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
@media screen {
  html { background: #d1d5db; padding: 10mm 0; }
  body {
    max-width: 210mm;
    margin: 0 auto;
    padding: 14mm 18mm 16mm 18mm;
    box-shadow: 0 4px 24px rgba(0,0,0,0.18);
    min-height: 297mm;
  }
}
@media print {
  html { background: #fff; padding: 0; }
  body { max-width: 100%; padding: 0; box-shadow: none; }
}

/* ── Header ─────────────────────────── */
.hdr {
  background: #1e3a5f;
  border-radius: 2pt;
  margin-bottom: 3mm;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.hdr-tbl { width: 100%; border-collapse: collapse; }
.hdr-tbl td { padding: 4.5mm 4mm; vertical-align: middle; }
.hdr-left { width: 55%; }
.hdr-right { width: 45%; }
.doc-icon {
  display: inline-block;
  width: 8.5mm; height: 8.5mm;
  background: rgba(255,255,255,0.15);
  border-radius: 1.5pt;
  text-align: center; line-height: 8.5mm;
  font-size: 13pt; color: #fff;
  vertical-align: middle;
  margin-right: 2.5mm;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.doc-title-wrap { display: inline-block; vertical-align: middle; }
.doc-title { font-size: 13pt; font-weight: 700; color: #fff; line-height: 1.15; }
.doc-subtitle { font-size: 7pt; color: #bfdbfe; margin-top: 0.5mm; }
.meta-tbl { width: 100%; border-collapse: collapse; }
.meta-tbl td { padding: 0.5mm 0; font-size: 7.5pt; vertical-align: top; }
.ml { color: #93c5fd; width: 25mm; white-space: nowrap; }
.mv { color: #fff; font-weight: 500; }
.mv-ok   { color: #6ee7b7; }
.mv-pend { color: #fcd34d; }

/* ── Signoff ─────────────────────────── */
.so-tbl { width: 100%; border-collapse: collapse; margin-bottom: 2mm; }
.sig-td {
  width: 50%;
  border: 1.5pt dashed #cbd5e1;
  border-radius: 2pt;
  padding: 3mm;
  vertical-align: top;
  background: #f8fafc;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sig-td:first-child { padding-right: 2mm; }
.sig-td:last-child  { padding-left: 2mm; border-left: none; }
.sig-signed {
  border: 1.5pt solid #16a34a !important;
  background: #f0fdf4 !important;
}
.sig-role  { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; margin-bottom: 1.5mm; }
.sig-name  { font-size: 10pt; font-weight: 700; color: #15803d; }
.sig-meta  { font-size: 7pt; color: #64748b; margin-top: 0.5mm; }
.sig-comment { font-size: 7pt; color: #64748b; font-style: italic; margin-top: 1.5mm; padding-top: 1.5mm; border-top: 0.5pt solid #e2e8f0; }
.sig-empty { font-size: 8pt; color: #94a3b8; font-style: italic; margin: 1mm 0 2.5mm; }
.sig-line  { font-size: 7pt; color: #94a3b8; margin-top: 1.5mm; }
.confirmed { background:#f0fdf4; border:0.5pt solid #bbf7d0; padding:1.5mm 3mm; border-radius:2pt; font-size:7.5pt; color:#15803d; margin-bottom:2mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ── Divider ─────────────────────────── */
hr { border:none; border-top:0.5pt solid #e2e8f0; margin:3.5mm 0; }

/* ── Section headings ────────────────── */
.section { margin-bottom:3.5mm; break-inside:avoid-page; }
.sh { margin-bottom:1.5mm; break-after:avoid; }
.sn {
  display: inline-block;
  width: 5mm; height: 5mm;
  background: #1e3a5f; color: #fff;
  border-radius: 50%;
  font-size: 6.5pt; font-weight: 700;
  text-align: center; line-height: 5mm;
  vertical-align: middle;
  margin-right: 2mm;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.st { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #1e3a5f; vertical-align: middle; }
.sb { font-size: 7pt; color: #94a3b8; vertical-align: middle; }
.sc { padding-left: 7mm; }

/* ── Narrative ───────────────────────── */
.narr {
  font-size: 8.5pt; line-height: 1.5; color: #1f2937;
  border: 0.5pt solid #e2e8f0; border-radius: 1.5pt;
  padding: 2mm 3mm; background: #f9fafb;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Stat cards ──────────────────────── */
.stat-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
.stat-td {
  border: 0.75pt solid #e2e8f0;
  border-radius: 2pt;
  padding: 2.5mm 1mm;
  text-align: center;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.stat-v { font-size: 16pt; font-weight: 700; line-height: 1; }
.stat-l { font-size: 6pt; color: #64748b; margin-top: 1mm; font-weight: 600; }

/* ── Data tables ─────────────────────── */
.data-tbl {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 7.5pt;
  break-inside: auto;
}
thead  { display: table-header-group; }
tr     { break-inside: avoid; page-break-inside: avoid; }
th, td {
  border: 0.5pt solid #d1d5db;
  padding: 1.5mm 2mm;
  text-align: left; vertical-align: top;
  word-break: break-word; overflow-wrap: break-word;
}
.th-default th { background:#f3f4f6; font-size:7pt; color:#374151; font-weight:700; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.th-oos th     { background:#fef2f2; font-size:7pt; color:#7f1d1d;  font-weight:700; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.th-overdue th { background:#fffbeb; font-size:7pt; color:#78350f;  font-weight:700; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
tr.alt td { background:#f9fafb; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.c    { text-align: center; }
.mono { font-family: 'Courier New', Courier, monospace; font-size: 7pt; }

/* ── Empty states ────────────────────── */
.empty { border:0.5pt dashed #d1d5db; border-radius:2pt; padding:3mm; text-align:center; color:#94a3b8; font-size:8pt; }
.empty.ok { border-color:#bbf7d0; background:#f0fdf4; color:#15803d; font-weight:600; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ── Footer ──────────────────────────── */
.footer { margin-top:5mm; border-top:0.5pt solid #e2e8f0; padding-top:1.5mm; }
.footer-tbl { width:100%; border-collapse:collapse; font-size:6.5pt; color:#94a3b8; }
.footer-tbl td:nth-child(2) { text-align:center; }
.footer-tbl td:nth-child(3) { text-align:right; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="hdr">
  <table class="hdr-tbl">
    <tr>
      <td class="hdr-left">
        <span class="doc-icon">&#x2697;</span>
        <div class="doc-title-wrap">
          <div class="doc-title">Monthly Stability Report</div>
          <div class="doc-subtitle">Pharmaceutical Stability Management &mdash; StabilityFlow</div>
        </div>
      </td>
      <td class="hdr-right">
        <table class="meta-tbl">
          <tr><td class="ml">Document No:</td><td class="mv">${esc(docNumber)}</td></tr>
          <tr><td class="ml">Period:</td><td class="mv">${esc(periodLabel)}</td></tr>
          <tr><td class="ml">Generated:</td><td class="mv">${fmtTs(now)}</td></tr>
          <tr><td class="ml">Status:</td><td class="${both?"mv-ok":"mv-pend"}">${both?"&#10003; Fully Signed Off":"Pending Sign-off"}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</div>

<!-- SIGN-OFFS -->
<table class="so-tbl">
  <tr>${sigCell("Section Head", headSO)}${sigCell("QC Manager", mgrSO)}</tr>
</table>
${both?`<div class="confirmed">&#10003; This report has been fully reviewed and signed off by both Section Head and QC Manager.</div>`:""}

<hr>

<!-- 1 -->
<div class="section">
  ${secHead(1,"Objective")}
  <div class="sc">${narr(notes.objective, DEF_OBJ)}</div>
</div><hr>

<!-- 2 -->
<div class="section">
  ${secHead(2,"Scope")}
  <div class="sc">${narr(notes.scope, DEF_SCP)}</div>
</div><hr>

<!-- 3 -->
<div class="section">
  ${secHead(3,`Summary \u2014 ${periodLabel}`)}
  <div class="sc">${statRow(sum)}</div>
</div><hr>

<!-- 4 -->
<div class="section">
  ${secHead(4,`Samples Scheduled \u2014 ${periodLabel}`, `${items.length} time point${items.length!==1?"s":""}`)}
  <div class="sc">${samplesTable(items)}</div>
</div><hr>

<!-- 5 -->
<div class="section">
  ${secHead(5,"OOS / OOT Results", oosItems.length>0?`${oosItems.length} result${oosItems.length!==1?"s":""}`:"")}
  <div class="sc">${oosTable(oosItems)}</div>
</div><hr>

<!-- 6 -->
<div class="section">
  ${secHead(6,"Overdue Samples", ovdItems.length>0?`${ovdItems.length} overdue`:"")}
  <div class="sc">${overdueTable(ovdItems, now)}</div>
</div><hr>

<!-- 7 -->
<div class="section">
  ${secHead(7,"Deviations")}
  <div class="sc">${narr(notes.deviations,'List any deviations from the stability protocol or testing schedule. Include reference numbers. Enter "None" if no deviations were observed.')}</div>
</div><hr>

<!-- 8 -->
<div class="section">
  ${secHead(8,"Discussion")}
  <div class="sc">${narr(notes.discussion, DEF_DIS)}</div>
</div><hr>

<!-- 9 -->
<div class="section">
  ${secHead(9,"Conclusion")}
  <div class="sc">${narr(notes.conclusion, DEF_CON)}</div>
</div>

<!-- FOOTER -->
<div class="footer">
  <table class="footer-tbl">
    <tr>
      <td>StabilityFlow &mdash; Pharmaceutical Stability Management</td>
      <td>${esc(docNumber)} &middot; ${esc(periodLabel)}</td>
      <td>CONFIDENTIAL &mdash; For internal use only</td>
    </tr>
  </table>
</div>

<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
</script>
</body>
</html>`;
}
