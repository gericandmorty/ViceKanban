import jsPDF from 'jspdf';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
  project?: { _id: string; name: string };
  assignee?: {
    username: string;
    email?: string;
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Design System
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  // GitHub Primer Palette
  white:      '#ffffff',
  bg:         '#f6f8fa',
  bgMuted:    '#f1f1f1',
  border:     '#d0d7de',
  borderSub:  '#e8ebed',
  fg:         '#1f2328', // Primary text
  fgMid:      '#636c76', // Secondary text
  fgDim:      '#8c959f', // Muted text
  accent:     '#0969da', // GitHub Blue
  accentBg:   '#ddf4ff',
  success:    '#1f883d', // GitHub Green
  successBg:  '#dafbe1',
  warning:    '#9a6700', // GitHub Orange
  warningBg:  '#fff8c5',
  danger:     '#cf222e', // GitHub Red
  dangerBg:   '#ffebe9',
  purple:     '#8250df', // GitHub Purple
  purpleBg:   '#fbefff',
  // Layout
  M:   12,   // page margin
  HH:  20,   // header height
  FH:  12,   // footer height
  ROW_H: 10,
  R:   1.5,  // standard radius
};

const TASKS_PER_PAGE = 14;

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  todo:        { label: 'Todo',        color: D.fgDim,   bg: D.bgMuted    },
  in_progress: { label: 'In Progress', color: D.accent,  bg: D.accentBg   },
  done:        { label: 'Done',        color: D.success, bg: D.successBg  },
  reviewed:    { label: 'Reviewed',    color: D.purple,  bg: D.purpleBg   },
};

const PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', color: D.danger,  bg: D.dangerBg  },
  high:   { label: 'High',   color: D.warning, bg: D.warningBg },
  medium: { label: 'Medium', color: D.accent,  bg: D.bgMuted   },
  low:    { label: 'Low',    color: D.fgDim,   bg: D.bgMuted   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Primitive Drawing Helpers
// ─────────────────────────────────────────────────────────────────────────────

function rr(doc: jsPDF, x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string) {
  if (fill)   doc.setFillColor(fill);
  if (stroke) doc.setDrawColor(stroke);
  doc.roundedRect(x, y, w, h, r, r, fill ? (stroke ? 'FD' : 'F') : 'S');
}

function hr(doc: jsPDF, x: number, y: number, w: number, col = D.border, lw = 0.25) {
  doc.setDrawColor(col);
  doc.setLineWidth(lw);
  doc.line(x, y, x + w, y);
}

function vl(doc: jsPDF, x: number, y: number, h: number, col = D.border, lw = 0.25) {
  doc.setDrawColor(col);
  doc.setLineWidth(lw);
  doc.line(x, y, x, y + h);
}

function txt(
  doc: jsPDF, s: string, x: number, y: number,
  sz: number, w: 'normal' | 'bold', col: string,
  align: 'left' | 'center' | 'right' = 'left',
) {
  doc.setFont('helvetica', w);
  doc.setFontSize(sz);
  doc.setTextColor(col);
  doc.text(s, x, y, { align });
}

function pill(
  doc: jsPDF, s: string, x: number, y: number, h: number,
  bg: string, fg: string,
): number {
  const padH = 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  const tw = doc.getTextWidth(s);
  const w = tw + padH * 2;
  rr(doc, x, y, w, h, h / 2, bg);
  doc.setTextColor(fg);
  doc.text(s, x + w / 2, y + h * 0.68, { align: 'center' });
  return w;
}

// ─────────────────────────────────────────────────────────────────────────────
// Donut / Pie Chart
// ─────────────────────────────────────────────────────────────────────────────

function pieSlice(
  doc: jsPDF,
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number,
  color: string,
) {
  const STEPS = Math.max(16, Math.round(Math.abs(endDeg - startDeg) / 2));
  const s = ((startDeg - 90) * Math.PI) / 180;
  const e = ((endDeg - 90) * Math.PI) / 180;
  const step = (e - s) / STEPS;

  const pts: [number, number][] = [];

  // outer arc
  for (let i = 0; i <= STEPS; i++) {
    const a = s + i * step;
    pts.push([cx + outerR * Math.cos(a), cy + outerR * Math.sin(a)]);
  }
  // inner arc (reverse) for donut
  if (innerR > 0) {
    for (let i = STEPS; i >= 0; i--) {
      const a = s + i * step;
      pts.push([cx + innerR * Math.cos(a), cy + innerR * Math.sin(a)]);
    }
  } else {
    pts.push([cx, cy]);
  }

  const segs = pts.slice(1).map((p, i) => [
    p[0] - pts[i][0], p[1] - pts[i][1],
  ] as [number, number]);

  doc.setFillColor(color);
  doc.lines(segs, pts[0][0], pts[0][1], [1, 1], 'F', true);
}

interface ChartSegment { value: number; color: string; label: string }

function donutChart(
  doc: jsPDF,
  cx: number, cy: number,
  outerR: number, innerR: number,
  segments: ChartSegment[],
  centerBig?: string,
  centerSmall?: string,
) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    // empty state
    doc.setFillColor(D.bgMuted);
    doc.circle(cx, cy, outerR, 'F');
    doc.setFillColor(D.white);
    doc.circle(cx, cy, innerR, 'F');
    txt(doc, 'No data', cx, cy + 2.5, 8, 'normal', D.fgDim, 'center');
    return;
  }

  let deg = 0;
  segments.forEach(seg => {
    const sweep = (seg.value / total) * 360;
    if (sweep < 0.3) { deg += sweep; return; }
    pieSlice(doc, cx, cy, outerR, innerR, deg, deg + sweep, seg.color);
    deg += sweep;
  });

  // white centre circle
  doc.setFillColor(D.white);
  doc.circle(cx, cy, innerR - 0.5, 'F');

  if (centerBig) {
    txt(doc, centerBig, cx, cy + 4, 18, 'bold', D.fg, 'center');
    if (centerSmall) {
      txt(doc, centerSmall, cx, cy + 10, 6.5, 'normal', D.fgMid, 'center');
    }
  }
}

function chartLegend(
  doc: jsPDF,
  x: number, y: number, w: number,
  segments: ChartSegment[],
  total: number,
) {
  const ROW = 8.5;
  segments.forEach((seg, i) => {
    const ry = y + i * ROW;
    // coloured dot
    doc.setFillColor(seg.color);
    doc.circle(x + 3, ry + 2, 2.5, 'F');
    // label
    txt(doc, seg.label, x + 9, ry + 4, 7, 'normal', D.fg);
    // count + pct
    const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
    txt(doc, `${seg.value}  (${pct}%)`, x + w, ry + 4, 7, 'bold', seg.color, 'right');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Vertical Bar Chart
// ─────────────────────────────────────────────────────────────────────────────

function vBarChart(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  data: { label: string; value: number; color: string }[],
  title: string,
) {
  const maxV  = Math.max(...data.map(d => d.value), 1);
  const TITLE_H = 10;
  const LABEL_H = 13;
  const chartH  = h - TITLE_H - LABEL_H;
  const n       = data.length;
  const colW    = w / n;
  const barW    = colW * 0.55;
  const barOff  = (colW - barW) / 2;

  // title
  txt(doc, title.toUpperCase(), x + w / 2, y + 7, 6.5, 'bold', D.fgDim, 'center');

  const cy = y + TITLE_H;

  // horizontal grid
  [0.25, 0.5, 0.75, 1].forEach(pct => {
    const gy = cy + chartH - chartH * pct;
    doc.setDrawColor(pct === 1 ? D.border : D.borderSub);
    doc.setLineWidth(pct === 1 ? 0.3 : 0.15);
    doc.line(x, gy, x + w, gy);
    const val = Math.round(maxV * pct);
    txt(doc, String(val), x - 1.5, gy + 1.5, 5, 'normal', D.fgDim, 'right');
  });

  // bars
  data.forEach((d, i) => {
    const bx = x + i * colW + barOff;
    const bh = Math.max(chartH * (d.value / maxV), 0.5);
    const by = cy + chartH - bh;

    // ghost track (use solid light color — jsPDF does not support 8-digit RGBA hex)
    doc.setFillColor(D.bgMuted);
    doc.roundedRect(bx, cy, barW, chartH, 1.5, 1.5, 'F');

    // solid fill
    doc.setFillColor(d.color);
    doc.roundedRect(bx, by, barW, bh, 1.5, 1.5, 'F');

    // value above bar
    if (d.value > 0) {
      txt(doc, String(d.value), bx + barW / 2, by - 2.5, 7, 'bold', d.color, 'center');
    }

    // x-axis label
    txt(doc, d.label, bx + barW / 2, cy + chartH + LABEL_H - 3, 6, 'normal', D.fgMid, 'center');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Horizontal Bar Chart
// ─────────────────────────────────────────────────────────────────────────────

function hBarChart(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  data: { label: string; value: number; color: string; subLabel?: string }[],
  title: string,
  maxOverride?: number,
) {
  const maxV = maxOverride ?? Math.max(...data.map(d => d.value), 1);
  const TITLE_H = 10;
  const chartY  = y + TITLE_H;
  const rowH    = (h - TITLE_H) / Math.max(data.length, 1);
  const LABLW   = 36;
  const trackW  = w - LABLW - 14;

  txt(doc, title.toUpperCase(), x + w / 2, y + 7, 6.5, 'bold', D.fgDim, 'center');

  data.forEach((d, i) => {
    const ry   = chartY + i * rowH;
    const barH = Math.min(rowH * 0.45, 6);
    const by   = ry + (rowH - barH) / 2;

    // row alternating bg
    if (i % 2 === 0) {
      doc.setFillColor(D.bg);
      doc.rect(x, ry, w, rowH, 'F');
    }

    // label
    const clip = d.label.length > 16 ? d.label.slice(0, 14) + '…' : d.label;
    txt(doc, clip, x + LABLW - 2, by + barH * 0.7 + 1, 6.5, 'normal', D.fg, 'right');

    // track
    doc.setFillColor(D.bgMuted);
    doc.roundedRect(x + LABLW, by, trackW, barH, barH / 2, barH / 2, 'F');

    // fill
    const fw = d.value > 0 ? Math.max(trackW * (d.value / maxV), 3) : 0;
    if (fw > 0) {
      doc.setFillColor(d.color);
      doc.roundedRect(x + LABLW, by, fw, barH, barH / 2, barH / 2, 'F');
    }

    // value + sublabel
    const vText = d.subLabel ? `${d.value} ${d.subLabel}` : String(d.value);
    txt(doc, vText, x + LABLW + trackW + 3, by + barH * 0.7 + 1, 6.5, 'bold', d.color);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Chrome (shared header + footer)
// ─────────────────────────────────────────────────────────────────────────────

function drawHeader(
  doc: jsPDF, logo: string | null, pw: number,
  pg: number, total: number, project: string,
) {
  doc.setFillColor(D.bg);
  doc.rect(0, 0, pw, D.HH, 'F');
  doc.setFillColor(D.accent);
  doc.rect(0, 0, pw, 2.5, 'F');
  hr(doc, 0, D.HH, pw, D.border, 0.35);

  let tx = D.M;
  if (logo) {
    doc.addImage(logo, 'PNG', D.M, 5, 10, 10);
    tx = D.M + 13;
  }

  txt(doc, 'ViceKanBan', tx, 13, 9, 'bold', D.fg);

  txt(doc, 'ViceKanBan', tx, 13, 9, 'bold', D.fg);

  // Center the Project Name as a bold Title
  const chipText = (project || 'All Projects').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(D.fg);
  doc.text(chipText, pw / 2, 12, { align: 'center' });

  txt(doc, `Page ${pg} / ${total}`, pw - D.M, 13, 7, 'normal', D.fgDim, 'right');
}

function drawFooter(doc: jsPDF, pw: number, ph: number) {
  hr(doc, 0, ph - D.FH, pw, D.border, 0.3);
  const ts = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  txt(doc, `Generated by ViceKanBan  ·  ${ts}`, D.M, ph - 3.5, 6, 'normal', D.fgDim);
  txt(doc, 'Internal · Confidential', pw - D.M, ph - 3.5, 6, 'normal', D.fgDim, 'right');
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 1: Cover
// ─────────────────────────────────────────────────────────────────────────────

async function drawCover(
  doc: jsPDF, logo: string | null, tasks: Task[],
  project: string, pw: number, ph: number,
) {
  // Full page subtle background
  doc.setFillColor(D.bg);
  doc.rect(0, 0, pw, ph, 'F');

  // Left accent sidebar
  doc.setFillColor(D.accent);
  doc.rect(0, 0, 4, ph, 'F');

  // Top accent bar
  doc.setFillColor(D.accent);
  doc.rect(4, 0, pw - 4, 3, 'F');

  // White content card
  const cardX = 14, cardY = 12, cardW = pw - 26, cardH = ph - 24;
  rr(doc, cardX, cardY, cardW, cardH, 6, D.white, D.border);

  // ── Left section (info) ────────────────────────────────────────────────────
  const lx  = cardX + 16;
  const lw  = cardW * 0.55;
  let   ly  = cardY + 22;

  // Brand
  if (logo) {
    doc.addImage(logo, 'PNG', lx, ly, 16, 16);
    txt(doc, 'ViceKanBan', lx + 20, ly + 11, 16, 'bold', D.fg);
  } else {
    txt(doc, 'ViceKanBan', lx, ly + 11, 16, 'bold', D.fg);
  }
  ly += 22;

  txt(doc, 'Project Management  ·  Gantt & Task Report', lx, ly, 8.5, 'normal', D.fgMid);
  ly += 12;

  hr(doc, lx, ly, lw - 12, D.borderSub, 0.4);
  ly += 10;

  // Project name
  txt(doc, project || 'All Projects', lx, ly, 22, 'bold', D.accent);
  ly += 9;

  const expDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  txt(doc, expDate, lx, ly, 7.5, 'normal', D.fgMid);
  ly += 18;

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const completed = tasks.filter(t => t.status === 'done' || t.status === 'reviewed').length;
  const overdue   = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date()
    && t.status !== 'done' && t.status !== 'reviewed'
  ).length;

  const stats = [
    { n: tasks.length,                                          label: 'Total Tasks',  color: D.accent,  bg: D.accentBg  },
    { n: tasks.filter(t => t.status === 'in_progress').length, label: 'In Progress',  color: D.accent,  bg: D.bgMuted   },
    { n: completed,                                             label: 'Completed',    color: D.success, bg: D.successBg },
    { n: overdue,                                               label: 'Overdue',      color: overdue > 0 ? D.danger : D.fgDim, bg: overdue > 0 ? D.dangerBg : D.bgMuted },
  ];

  const sW = (lw - 12 - 9) / 4;
  stats.forEach((s, i) => {
    const sx = lx + i * (sW + 3);
    rr(doc, sx, ly, sW, 28, 4, s.bg, D.border);
    // top colour stripe
    doc.setFillColor(s.color);
    doc.roundedRect(sx, ly, sW, 3, 2, 2, 'F');
    doc.rect(sx, ly + 1, sW, 2, 'F');
    txt(doc, String(s.n), sx + sW / 2, ly + 16, 18, 'bold', s.color, 'center');
    txt(doc, s.label.toUpperCase(), sx + sW / 2, ly + 24, 5, 'bold', D.fgDim, 'center');
  });
  ly += 36;

  // ── Overall completion bar ──────────────────────────────────────────────────
  const pct    = tasks.length > 0 ? completed / tasks.length : 0;
  const barW   = lw - 12;
  const barH   = 8;

  txt(doc, 'Overall Completion', lx, ly - 2, 7.5, 'bold', D.fg);
  txt(doc, `${Math.round(pct * 100)}%`, lx + barW, ly - 2, 7.5, 'bold', D.success, 'right');

  rr(doc, lx, ly, barW, barH, 4, D.bgMuted, D.border);
  if (pct > 0) {
    // solid fill — no semi-transparent shimmer (RGBA hex unsupported in jsPDF)
    rr(doc, lx, ly, Math.max(barW * pct, 10), barH, 4, D.success);
  }
  ly += barH + 14;

  // ── Status breakdown list ───────────────────────────────────────────────────
  txt(doc, 'STATUS BREAKDOWN', lx, ly - 1, 6, 'bold', D.fgDim);
  hr(doc, lx, ly + 2, barW, D.borderSub, 0.3);
  ly += 7;

  const statuses = ['todo', 'in_progress', 'done', 'reviewed'] as const;
  statuses.forEach((s, i) => {
    const sc  = STATUS[s];
    const cnt = tasks.filter(t => t.status === s).length;
    const sp  = tasks.length > 0 ? cnt / tasks.length : 0;
    const ry  = ly + i * 9;

    // dot
    doc.setFillColor(sc.color);
    doc.circle(lx + 2.5, ry - 0.5, 2.5, 'F');

    txt(doc, sc.label, lx + 8, ry + 1.5, 7, 'normal', D.fg);
    txt(doc, `${cnt}`, lx + barW - 16, ry + 1.5, 7, 'bold', sc.color, 'right');

    // mini progress bar
    const mW = 14, mH = 3;
    rr(doc, lx + barW - 14, ry - 2.5, mW, mH, 1.5, D.bgMuted);
    if (sp > 0) rr(doc, lx + barW - 14, ry - 2.5, Math.max(mW * sp, 2), mH, 1.5, sc.color);
  });
  ly += statuses.length * 9 + 10;

  // ── Top contributors ────────────────────────────────────────────────────────
  const assigneeMap: Record<string, number> = {};
  tasks.forEach(t => {
    const n = t.assignee?.firstName
      ? `${t.assignee.firstName} ${t.assignee.lastName || ''}`.trim()
      : (t.assignee?.username || 'Unassigned');
    assigneeMap[n] = (assigneeMap[n] || 0) + 1;
  });

  const contributors = Object.entries(assigneeMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  if (contributors.length > 0) {
    txt(doc, 'TOP CONTRIBUTORS', lx, ly - 1, 6, 'bold', D.fgDim);
    hr(doc, lx, ly + 2, barW, D.borderSub, 0.3);
    ly += 7;

    contributors.forEach(([name, count], i) => {
      const ry = ly + i * 9;
      const rankColors = [D.accent, D.success, D.warning, D.fgDim];
      rr(doc, lx, ry - 4.5, 6, 6, 1.5, rankColors[i] ?? D.bgMuted);
      txt(doc, String(i + 1), lx + 3, ry, 5, 'bold', D.white, 'center');
      const clip = name.length > 24 ? name.slice(0, 22) + '…' : name;
      txt(doc, clip, lx + 9, ry, 7, 'normal', D.fg);
      txt(doc, `${count} task${count > 1 ? 's' : ''}`, lx + barW, ry, 7, 'bold', D.accent, 'right');
    });
  }

  // ── Right section: Donut chart ─────────────────────────────────────────────
  const rxStart = cardX + lw + 20;
  const rxMid    = rxStart + (cardX + cardW - rxStart) / 2;
  const ry0      = cardY + 28;

  txt(doc, 'TASK DISTRIBUTION', rxMid, ry0, 6.5, 'bold', D.fgDim, 'center');
  hr(doc, rxStart, ry0 + 4, cardX + cardW - rxStart - 14, D.borderSub, 0.3);

  const donutCX = rxMid;
  const donutCY = ry0 + 60;
  const oR = 48, iR = 30;

  const chartPct = Math.round(pct * 100);
  const chartLabel = `${chartPct}%`;

  const donutSegs: ChartSegment[] = statuses.map(s => ({
    value: tasks.filter(t => t.status === s).length,
    color: STATUS[s].color,
    label: STATUS[s].label,
  }));

  donutChart(doc, donutCX, donutCY, oR, iR, donutSegs, chartLabel, 'Complete');

  // legend below chart
  const legendY  = donutCY + oR + 8;
  const legendX  = rxStart;
  const legendW  = cardX + cardW - rxStart - 14;
  chartLegend(doc, legendX, legendY, legendW, donutSegs, tasks.length);

  // accent bottom bar
  doc.setFillColor(D.accent);
  doc.rect(4, ph - 3, pw - 4, 3, 'F');
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 2: Gantt Chart
// ─────────────────────────────────────────────────────────────────────────────

async function drawGantt(
  doc: jsPDF, logo: string | null, tasks: Task[],
  project: string, pw: number, ph: number,
  pageIdx: number, totalPages: number,
  fullDateRangeTasks: Task[],
) {
  drawHeader(doc, logo, pw, pageIdx, totalPages, project);
  drawFooter(doc, pw, ph);

  const CY = D.HH + 5;
  const CW = pw - D.M * 2;

  txt(doc, 'Gantt Chart  -  Timeline View', D.M, CY + 7, 11, 'bold', D.fg);
  txt(doc, getDateRange(tasks), D.M, CY + 14, 7, 'normal', D.fgMid);

  // Status Legend
  const lxOffset = pw - D.M;
  const lyOffset = CY + 14;
  const legendItems = [
    { label: 'RV: Reviewed',    color: D.purple },
    { label: 'DN: Done',        color: D.success },
    { label: 'IP: In Progress', color: D.accent },
    { label: 'TD: Todo',        color: D.fgDim },
  ];
  let curLx = lxOffset;
  legendItems.forEach(item => {
    txt(doc, item.label, curLx, lyOffset, 6.5, 'bold', item.color, 'right');
    curLx -= (doc.getTextWidth(item.label) + 6);
  });

  const ganttY = CY + 19;
  const ganttH = ph - D.HH - D.FH - 10 - ganttY; // extra 5mm bottom margin for safety
  const ganttW = CW;
  const SIDE   = 70; // wider sidebar for larger font
  const TLW    = ganttW - SIDE;

  const { startDate, days } = computeDateRange(fullDateRangeTasks);
  const dayW = TLW / Math.max(days.length, 1);

  // outer card
  rr(doc, D.M, ganttY, ganttW, ganttH, 4, D.white, D.border);

  // ── Header band ─────────────────────────────────────────────────────
  const BH = 20;
  doc.setFillColor(D.bg);
  doc.rect(D.M, ganttY, ganttW, BH, 'F');
  hr(doc, D.M, ganttY + BH, ganttW, D.border, 0.35);

  // sidebar header
  doc.setFillColor(D.bgMuted);
  doc.rect(D.M, ganttY, SIDE, BH, 'F');
  vl(doc, D.M + SIDE, ganttY, ganttH, D.border, 0.35);
  txt(doc, 'TASK NAME', D.M + 4, ganttY + 8.5, 8.5, 'bold', D.fg);
  txt(doc, 'STATUS', D.M + SIDE - 4, ganttY + 8.5, 8, 'bold', D.fgMid, 'right');

  // month labels (top of header band)
  const months: { name: string; startIdx: number }[] = [];
  days.forEach((d, i) => {
    const mn = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!months.length || months[months.length - 1].name !== mn)
      months.push({ name: mn, startIdx: i });
  });
  months.forEach(m => {
    const mx = D.M + SIDE + m.startIdx * dayW;
    vl(doc, mx, ganttY, BH / 2, D.border, 0.2);
    txt(doc, m.name.toUpperCase(), mx + 3, ganttY + 7, 7.5, 'bold', D.fg);
  });

  // day columns
  days.forEach((d, i) => {
    const dx = D.M + SIDE + i * dayW;
    const isToday  = d.toDateString() === new Date().toDateString();
    const isWknd = d.getDay() === 0 || d.getDay() === 6;

    if (isToday) {
      // Light solid blue — RGBA hex unsupported in jsPDF
      doc.setFillColor('#e8f3ff');
      doc.rect(dx, ganttY, dayW, ganttH, 'F');
    } else if (isWknd) {
      doc.setFillColor('#f8f9fb');
      doc.rect(dx, ganttY, dayW, ganttH, 'F');
    }

    vl(doc, dx, ganttY, ganttH, D.borderSub, 0.12);

    if (dayW >= 5) {
      doc.setFont('helvetica', isToday ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(isToday ? D.accent : D.fgMid);
      doc.text(String(d.getDate()), dx + dayW / 2, ganttY + BH - 5.5, { align: 'center' });

      if (dayW >= 16) {
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
        doc.setFontSize(6.5);
        doc.setTextColor(D.fgDim);
        doc.text(dayLabel, dx + dayW / 2, ganttY + BH - 12, { align: 'center' });
      }
    }
  });

  // TODAY marker removed per user request

  // ── Task rows with Project Grouping ──────────────────────────────────
  const avH   = ganttH - BH;
  const ROW_H = D.ROW_H;
  const s0    = startDate.getTime();
  
  let currentY = ganttY + BH;
  let lastProject = '';

  tasks.forEach((task, ri) => {
    // Check for project change
    const currentProjectName = task.project?.name || project || 'Unknown Project';
    const isNewProject = currentProjectName !== lastProject;
    
    if (isNewProject) {
      // Draw Project Group Header Row (contained)
      doc.setFillColor(D.accent);
      doc.rect(D.M, currentY, 2, ROW_H, 'F'); // left accent
      doc.rect(D.M + ganttW - 2, currentY, 2, ROW_H, 'F'); // right accent (prevents overshoot feeling)
      doc.setFillColor(D.accentBg);
      doc.rect(D.M + 2, currentY, ganttW - 4, ROW_H, 'F'); // background (slightly narrower)
      txt(doc, `PROJECT: ${currentProjectName.toUpperCase()}`, D.M + 6, currentY + ROW_H / 2 + 1.5, 7.5, 'bold', D.accent);
      hr(doc, D.M, currentY + ROW_H, ganttW, D.accent, 0.2);
      
      currentY += ROW_H;
      lastProject = currentProjectName;
    }

    const ry = currentY;

    // zebra (using local index for shading)
    if (ri % 2 === 1) {
      doc.setFillColor('#f9fafc');
      doc.rect(D.M, ry, ganttW, ROW_H, 'F');
    }
    hr(doc, D.M, ry + ROW_H, ganttW, D.borderSub, 0.12);

    const sc = STATUS[task.status] || STATUS.todo;

    // status dot in sidebar
    doc.setFillColor(sc.color);
    doc.circle(D.M + 4, ry + ROW_H / 2, 2, 'F');

    // task name (no longer need project prefix here)
    const nameClip = task.title.length > 28 ? task.title.slice(0, 26) + '…' : task.title;
    txt(doc, nameClip, D.M + 10, ry + ROW_H / 2 + 2, 8.5, 'normal', D.fg);

    // status abbreviation
    const abbr = { todo: 'TD', in_progress: 'IP', done: 'DN', reviewed: 'RV' }[task.status] ?? '??';
    rr(doc, D.M + SIDE - 14, ry + ROW_H / 2 - 4, 11, 8.5, 2, sc.bg);
    txt(doc, abbr, D.M + SIDE - 8.5, ry + ROW_H / 2 + 1.2, 6.5, 'bold', sc.color, 'center');

    // Gantt bar
    const ts  = new Date(task.startDate || task.createdAt); ts.setHours(0, 0, 0, 0);
    const te  = task.dueDate ? new Date(task.dueDate) : new Date(); te.setHours(0, 0, 0, 0);
    const sOff = (ts.getTime() - s0) / 86400000;
    const eOff = (te.getTime() - s0) / 86400000;
    const bx  = D.M + SIDE + sOff * dayW;
    const bw  = Math.max((eOff - sOff) * dayW, 4);
    const bh  = 4.5; // Thinner, high-fidelity bars
    const by  = ry + (ROW_H - bh) / 2;

    const isDone   = task.status === 'done' || task.status === 'reviewed';
    const isUrgent = task.priority === 'urgent';
    const col      = isDone ? D.success : isUrgent ? D.danger : D.accent;
    const prog     = { todo: 0, in_progress: 0.5, done: 0.85, reviewed: 1 }[task.status] ?? 0;

    // GitHub subtle bar styling
    const ghostBg = isDone ? D.successBg : (isUrgent ? D.dangerBg : D.accentBg);
    doc.setFillColor(ghostBg);
    doc.roundedRect(bx, by, bw, bh, bh/2, bh/2, 'F');
    if (prog > 0) {
      doc.setFillColor(col);
      doc.roundedRect(bx, by, Math.max(bw * prog, 3), bh, bh/2, bh/2, 'F');
    }

    currentY += ROW_H;
  });

  // outer border over everything
  doc.setDrawColor(D.border);
  doc.setLineWidth(0.35);
  doc.roundedRect(D.M, ganttY, ganttW, ganttH, 4, 4, 'S');
}

async function drawAnalytics(
  doc: jsPDF, logo: string | null, tasks: Task[],
  project: string, pw: number, ph: number,
  pageIdx: number, totalPages: number,
) {
  drawHeader(doc, logo, pw, pageIdx, totalPages, project);
  drawFooter(doc, pw, ph);

  const CW = pw - D.M * 2;
  let y = D.HH + 6;

  // ── Section title helper ─────────────────────────────────────────────
  function section(title: string) {
    doc.setFillColor(D.accent);
    doc.rect(D.M, y, 3, 9, 'F');
    txt(doc, title, D.M + 8, y + 7, 9, 'bold', D.fg);
    hr(doc, D.M + 8, y + 10, CW - 8, D.border, 0.3);
    y += 18;
  }

  // ══════════════════════════════════════════════════════════════════════
  // ROW 1: Three charts
  // ══════════════════════════════════════════════════════════════════════
  section('Analytics Overview');



  const ROW1_H = 86;
  const chartGap = 8;
  const cW3 = (CW - chartGap * 2) / 3;

  // ── Chart 1: Status donut ──────────────────────────────────────────
  const donutSegs: ChartSegment[] = [
    { value: tasks.filter(t => t.status === 'todo').length,        color: D.fgDim,   label: 'Todo'        },
    { value: tasks.filter(t => t.status === 'in_progress').length, color: D.accent,  label: 'In Progress' },
    { value: tasks.filter(t => t.status === 'done').length,        color: D.success, label: 'Done'        },
    { value: tasks.filter(t => t.status === 'reviewed').length,    color: D.purple,  label: 'Reviewed'    },
  ];

  const completed = tasks.filter(t => t.status === 'done' || t.status === 'reviewed').length;
  const pct = tasks.length > 0 ? completed / tasks.length : 0;

  // card bg
  rr(doc, D.M, y, cW3, ROW1_H, 4, D.white, D.border);

  txt(doc, 'TASK STATUS', D.M + cW3 / 2, y + 7, 6.5, 'bold', D.fgDim, 'center');
  hr(doc, D.M + 6, y + 9, cW3 - 12, D.borderSub, 0.25);

  const dCX = D.M + cW3 * 0.42;
  const dCY = y + 13 + 26;
  donutChart(doc, dCX, dCY, 26, 15, donutSegs, `${Math.round(pct * 100)}%`, 'done');

  // legend
  donutSegs.forEach((seg, i) => {
    const lx = D.M + cW3 * 0.72;
    const ly2 = y + 18 + i * 10;
    doc.setFillColor(seg.color);
    doc.circle(lx, ly2 + 2, 2.5, 'F');
    txt(doc, seg.label, lx + 5, ly2 + 3.5, 6.5, 'normal', D.fg);
    txt(doc, String(seg.value), D.M + cW3 - 6, ly2 + 3.5, 6.5, 'bold', seg.color, 'right');
  });

  // ── Chart 2: Priority vertical bars ────────────────────────────────
  const c2X = D.M + cW3 + chartGap;
  rr(doc, c2X, y, cW3, ROW1_H, 4, D.white, D.border);

  const prioData = [
    { label: 'Urgent', value: tasks.filter(t => (t.priority || 'low') === 'urgent').length, color: D.danger  },
    { label: 'High',   value: tasks.filter(t => (t.priority || 'low') === 'high').length,   color: D.warning },
    { label: 'Medium', value: tasks.filter(t => (t.priority || 'low') === 'medium').length, color: D.accent  },
    { label: 'Low',    value: tasks.filter(t => (t.priority || 'low') === 'low').length,    color: D.fgDim   },
  ];
  vBarChart(doc, c2X + 8, y + 2, cW3 - 16, ROW1_H - 4, prioData, 'Priority Distribution');

  // ── Chart 3: Assignee workload (horizontal bars) ────────────────────
  const c3X = D.M + (cW3 + chartGap) * 2;
  rr(doc, c3X, y, cW3, ROW1_H, 4, D.white, D.border);

  const assigneeMap: Record<string, number> = {};
  tasks.forEach(t => {
    const n = t.assignee?.username || 'Unassigned';
    assigneeMap[n] = (assigneeMap[n] || 0) + 1;
  });

  const assigneeData = Object.entries(assigneeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value], i) => ({
      label, value,
      color: [D.accent, D.success, D.purple, D.warning, D.danger, D.fgMid][i] ?? D.fgMid,
      subLabel: `task${value > 1 ? 's' : ''}`,
    }));

  hBarChart(doc, c3X + 6, y + 2, cW3 - 12, ROW1_H - 4, assigneeData, 'Team Workload');

  y += ROW1_H + 10;

  // ══════════════════════════════════════════════════════════════════════
  // ROW 2: Completion metrics (3 KPI chips)
  // ══════════════════════════════════════════════════════════════════════
  section('Key Metrics');

  const overdue   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()
    && t.status !== 'done' && t.status !== 'reviewed').length;
  const avgDurMs  = (() => {
    const withDur = tasks.filter(t => t.startDate && t.dueDate);
    if (!withDur.length) return 0;
    return withDur.reduce((s, t) =>
      s + new Date(t.dueDate!).getTime() - new Date(t.startDate!).getTime(), 0)
      / withDur.length;
  })();
  const avgDays = avgDurMs > 0 ? Math.round(avgDurMs / 86400000) : 0;

  const kpis = [
    { label: 'Completion Rate',    value: `${Math.round(pct * 100)}%`,      sub: `${completed} of ${tasks.length} tasks done`, color: D.success, bg: D.successBg },
    { label: 'Overdue Tasks',      value: String(overdue),                   sub: overdue > 0 ? 'Needs attention' : 'All on track', color: overdue > 0 ? D.danger : D.success, bg: overdue > 0 ? D.dangerBg : D.successBg },
    { label: 'Avg. Task Duration', value: avgDays > 0 ? `${avgDays}d` : '—', sub: 'From start to due date',            color: D.accent,  bg: D.accentBg  },
    { label: 'In Progress',        value: String(tasks.filter(t => t.status === 'in_progress').length), sub: 'Currently being worked on', color: D.accent, bg: D.bgMuted },
  ];

  const kpiW = (CW - 9) / 4;
  kpis.forEach((k, i) => {
    const kx = D.M + i * (kpiW + 3);
    rr(doc, kx, y, kpiW, 22, 4, k.bg, D.border);
    txt(doc, k.value, kx + kpiW / 2, y + 11, 16, 'bold', k.color, 'center');
    txt(doc, k.label, kx + kpiW / 2, y + 18, 5.5, 'bold', D.fgDim, 'center');
  });

  y += 22 + 10;

  // ══════════════════════════════════════════════════════════════════════
  // ROW 3: Detailed Task Table
  // ══════════════════════════════════════════════════════════════════════
}


// ─────────────────────────────────────────────────────────────────────────────
// Date Helpers
// ─────────────────────────────────────────────────────────────────────────────

function computeDateRange(tasks: Task[]) {
  const now = new Date();
  let earliest = new Date(now); earliest.setDate(now.getDate() - 5);
  let latest   = new Date(now); latest.setDate(now.getDate() + 14);

  tasks.forEach(t => {
    const s = new Date(t.startDate || t.createdAt); s.setHours(0, 0, 0, 0);
    const e = t.dueDate ? new Date(t.dueDate) : null;
    if (e) e.setHours(0, 0, 0, 0);
    if (s < earliest) earliest = s;
    if (e && e > latest) latest  = e;
  });

  const startDate = new Date(earliest); startDate.setDate(earliest.getDate() - 2); startDate.setHours(0, 0, 0, 0);
  const endDate   = new Date(latest);   endDate.setDate(latest.getDate() + 7);   endDate.setHours(23, 59, 59, 999);

  const days: Date[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

  return { startDate, endDate, days };
}

function getDateRange(tasks: Task[]): string {
  const { startDate, endDate } = computeDateRange(tasks);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(startDate)}  —  ${fmt(endDate)}`;
}

function getContributors(tasks: Task[]) {
  return Array.from(new Set(tasks.map(t => t.assignee?.username).filter(Boolean))).sort();
}

/** ─────────────────────────────────────────────────────────────────────────────
 * Page 4: Team Contributors
 * ───────────────────────────────────────────────────────────────────────────── */
async function drawTeamPage(
  doc: jsPDF, logo: string | null, tasks: Task[],
  project: string, pw: number, ph: number,
  pageIdx: number, total: number
) {
  drawHeader(doc, logo, pw, pageIdx, total, project);
  drawFooter(doc, pw, ph);

  const CW = pw - D.M * 2;
  let y = D.HH + 10;

  doc.setFillColor(D.accent);
  doc.rect(D.M, y, 3, 10, 'F');
  txt(doc, 'PROJECT CONTRIBUTORS', D.M + 8, y + 8, 11, 'bold', D.fg);
  hr(doc, D.M + 8, y + 12, CW - 8, D.border, 0.4);
  y += 24;

  // Aggregate unique users and their emails
  const userMap = new Map<string, string>();
  tasks.forEach(t => {
    if (t.assignee?.username) {
      userMap.set(t.assignee.username, t.assignee.email || 'No email');
    }
  });
  const usernames = Array.from(userMap.keys()).sort();

  if (usernames.length === 0) {
    txt(doc, 'No contributors assigned to tasks in this project.', D.M + 8, y, 9, 'normal', D.fgDim);
    return;
  }

  const COLS = 4;
  const colW = CW / COLS;
  const rowH = 16; // Increased from 12 for name + email

  usernames.forEach((username, i) => {
    const colIdx = i % COLS;
    const rowIdx = Math.floor(i / COLS);
    const ux = D.M + colIdx * colW;
    const uy = y + rowIdx * rowH;

    const email = userMap.get(username) || '—';
    // GitHub Member Card style
    rr(doc, ux, uy - 4, colW - 6, rowH - 2, 1.5, D.white, D.border);
    
    txt(doc, username, ux + 6, uy + 2, 8.5, 'bold', D.fg);
    txt(doc, email, ux + 6, uy + 6.5, 7, 'normal', D.fgMid);
  });
}

/** ─────────────────────────────────────────────────────────────────────────────
 * Page 5+: Detailed Task Ledger
 * ───────────────────────────────────────────────────────────────────────────── */
async function drawDetailedLedger(
  doc: jsPDF, logo: string | null, tasks: Task[],
  project: string, pw: number, ph: number,
  startPageIdx: number, totalPages: number
) {
  const CW = pw - D.M * 2;
  const ftrBound = ph - D.FH - 14;
  const TH = 12; // Table Header height
  const TR = 10; // Table Row height
  const PH = 14; // Project Header height

  const rawCols = [
    { label: '#',          w: 10 },
    { label: 'Task Title', w: 85 },
    { label: 'Status',     w: 26 },
    { label: 'Priority',   w: 22 },
    { label: 'Assignee',   w: 36 },
    { label: 'Start',      w: 24 },
    { label: 'Due',        w: 24 },
    { label: 'Duration',   w: 20 },
  ];
  const rawTotal = rawCols.reduce((s, c) => s + c.w, 0);
  const scale    = CW / rawTotal;
  const cols     = rawCols.map(c => ({ ...c, w: c.w * scale }));

  let currentPg = startPageIdx;
  let y = 0;

  const renderPageChrome = (pg: number) => {
    drawHeader(doc, logo, pw, pg, totalPages, project);
    drawFooter(doc, pw, ph);
    let ty = D.HH + 10;
    doc.setFillColor(D.accent);
    doc.rect(D.M, ty, 3, 10, 'F');
    txt(doc, 'DETAILED PROJECT LEDGER', D.M + 8, ty + 8, 11, 'bold', D.fg);
    hr(doc, D.M + 8, ty + 12, CW - 8, D.border, 0.4);
    return ty + 22;
  };

  const renderTableHeader = (ty: number) => {
    rr(doc, D.M, ty, CW, TH, 1.5, D.bg, D.border);
    let hx = D.M + 3;
    cols.forEach(c => {
      txt(doc, c.label, hx, ty + 7.5, 8.5, 'bold', D.fg);
      hx += c.w;
    });
    return ty + TH;
  };

  // Group tasks
  const groups = new Map<string, Task[]>();
  tasks.forEach(t => {
    const pn = t.project?.name || project || 'Unknown Project';
    if (!groups.has(pn)) groups.set(pn, []);
    groups.get(pn)!.push(t);
  });

  y = renderPageChrome(currentPg);

  for (const [projectName, pTasks] of groups.entries()) {
    // 1. Draw Project Header (GitHub Box Header Style)
    if (y + PH + TH + TR > ftrBound) {
      doc.addPage(); currentPg++;
      y = renderPageChrome(currentPg);
    }

    rr(doc, D.M, y, CW, PH, 2, D.bg, D.border);
    // Draw an "Issue Group" style heading
    doc.setFillColor(D.accent);
    doc.rect(D.M + 4, y + 4, 3, 6, 'F');
    txt(doc, projectName.toUpperCase(), D.M + 9, y + PH/2 + 1.5, 9, 'bold', D.fg);
    y += PH;

    // 2. Draw Table Header (GitHub Box Row)
    rr(doc, D.M, y, CW, TH, 0, D.white, D.border);
    let hx = D.M + 3;
    cols.forEach(c => {
      txt(doc, c.label, hx, y + 7.5, 8, 'bold', D.fgMid);
      hx += c.w;
    });
    y += TH;

    // 3. Draw Tasks
    pTasks.forEach((t, i) => {
      if (y + TR > ftrBound) {
        doc.addPage(); currentPg++;
        y = renderPageChrome(currentPg);
        // Continuation label - move it slightly lower and align with the box
        txt(doc, `${projectName.toUpperCase()} (CONTINUED)`, D.M, y - 5, 7.5, 'bold', D.accent);
        // Repeat headers
        rr(doc, D.M, y, CW, TH, 0, D.white, D.border);
        let hhx = D.M + 3;
        cols.forEach(c => {
          txt(doc, c.label, hhx, y + 7.5, 8, 'bold', D.fgMid);
          hhx += c.w;
        });
        y += TH;
      }

      doc.setFillColor(D.white);
      doc.rect(D.M, y, CW, TR, 'F');
      hr(doc, D.M, y, CW, D.border, 0.12);
      vl(doc, D.M, y, TR, D.border, 0.12);
      vl(doc, D.M + CW, y, TR, D.border, 0.12);

      let tx = D.M + 3;
      const ty = y + TR / 2 + 2.2;
      const sc = STATUS[t.status] || STATUS.todo;
      const pc = PRIORITY[t.priority || 'low'];

      txt(doc, String(i+1), tx, ty, 7, 'normal', D.fgDim); tx += cols[0].w;
      const clip = t.title.length > 45 ? t.title.slice(0, 43) + '…' : t.title;
      txt(doc, clip, tx, ty, 8.5, 'normal', D.fg); tx += cols[1].w;
      
      // Label pills
      pill(doc, sc.label.toUpperCase(), tx, y + 2, 6, sc.bg, sc.color); tx += cols[2].w;
      pill(doc, pc.label.toUpperCase(), tx, y + 2, 6, pc.bg, pc.color); tx += cols[3].w;
      
      const u = t.assignee?.username || '—';
      txt(doc, u.length > 20 ? u.slice(0, 18) + '…' : u, tx, ty, 8, 'normal', D.fgMid); tx += cols[4].w;

      const fmt = (d: string | undefined) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—';
      txt(doc, fmt(t.startDate), tx, ty, 7, 'normal', D.fgMid); tx += cols[5].w;
      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done' && t.status !== 'reviewed';
      txt(doc, fmt(t.dueDate), tx, ty, 7, isOverdue ? 'bold' : 'normal', isOverdue ? D.danger : D.fgMid); tx += cols[6].w;

      const dStart = new Date(t.startDate || t.createdAt);
      const dEnd   = t.dueDate ? new Date(t.dueDate) : new Date();
      const durD   = Math.max(0, Math.floor((dEnd.getTime() - dStart.getTime()) / 86400000));
      txt(doc, `${durD}d`, tx, ty, 7, 'normal', D.fgMid);

      y += TR;
    });

    // Close the box
    hr(doc, D.M, y, CW, D.border, 0.4);
    y += 14; 
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Loader
// ─────────────────────────────────────────────────────────────────────────────

async function loadLogo(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext('2d')!.drawImage(img, 0, 0);
      resolve(cv.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Cannot load: ${src}`));
    img.src = src;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export async function exportGanttToPDF(tasks: Task[], projectName: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const pw  = doc.internal.pageSize.getWidth();
  const ph  = doc.internal.pageSize.getHeight();

  let logo: string | null = null;
  try { logo = await loadLogo('/icons/icon_vice.png'); } catch { /* logo optional */ }

  // 0. Sort Tasks by Project then date
  const sortedTasks = [...tasks].sort((a, b) => {
    const pA = a.project?.name || '';
    const pB = b.project?.name || '';
    if (pA !== pB) return pA.localeCompare(pB);
    return new Date(a.startDate || a.createdAt).getTime() - new Date(b.startDate || b.createdAt).getTime();
  });

  const activeTasks = sortedTasks;

  // Calculation for total pages
  const ganttPgCount = Math.ceil(activeTasks.length / TASKS_PER_PAGE) || 1;
  const analyticsPgCount = 1;
  const teamPgCount = 1;
  
  // Ledger calculation (headers add variance, so we use a safe estimate)
  const LEDGER_PER_PAGE = 20;
  const ledgerPgCount = Math.ceil(activeTasks.length / LEDGER_PER_PAGE) || 1;

  const totalPages = ganttPgCount + analyticsPgCount + teamPgCount + ledgerPgCount;
  let cursor = 1;

  // 1. Gantt Pages
  for (let i = 0; i < ganttPgCount; i++) {
    if (i > 0) doc.addPage();
    const chunk = activeTasks.slice(i * TASKS_PER_PAGE, (i + 1) * TASKS_PER_PAGE);
    await drawGantt(doc, logo, chunk, projectName, pw, ph, cursor, totalPages, activeTasks);
    cursor++;
  }

  // 2. Analytics Page
  doc.addPage();
  await drawAnalytics(doc, logo, activeTasks, projectName, pw, ph, cursor, totalPages);
  cursor++;

  // 3. Team Page
  doc.addPage();
  await drawTeamPage(doc, logo, activeTasks, projectName, pw, ph, cursor, totalPages);
  cursor++;

  // 4. Detailed Ledger Pages
  doc.addPage();
  await drawDetailedLedger(doc, logo, activeTasks, projectName, pw, ph, cursor, totalPages);

  const safe = (projectName || 'Report').replace(/\s+/g, '_');
  const date = new Date().toISOString().split('T')[0];
  doc.save(`ViceKanBan_${safe}_${date}.pdf`);
}
