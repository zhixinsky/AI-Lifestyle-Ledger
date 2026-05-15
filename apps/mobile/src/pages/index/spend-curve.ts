/**
 * 将 statistics.trend（period=month 时为 MM-DD）汇总为「当月每日支出」数组。
 * 与 AI米粒页面同目录输出 spend-curve.js，避免引用根目录 utils 时小程序 require 失败。
 */
export function dailyExpenseFromTrend(
  trend: Array<{ date: string; expense: number }> | undefined,
  year: number,
  month: number
): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const out = new Array(daysInMonth).fill(0);
  if (!trend?.length) return out;
  const mm = String(month).padStart(2, '0');
  for (const row of trend) {
    const parts = row.date.split('-').map((s) => s.trim());
    if (parts.length < 2) continue;
    const mPart = parts[0];
    const dPart = parts[1];
    if (mPart !== mm) continue;
    const d = parseInt(dPart, 10);
    if (d >= 1 && d <= daysInMonth) {
      out[d - 1] += row.expense || 0;
    }
  }
  return out;
}

function smoothSeries3(v: number[]): number[] {
  if (v.length <= 2) return [...v];
  const r = v.map((x) => x);
  for (let i = 1; i < v.length - 1; i++) {
    r[i] = (v[i - 1] + v[i] + v[i + 1]) / 3;
  }
  return r;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function buildCurvePathD(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function buildSpendCurveSvgRaw(series: number[], todayDayIndex: number): string {
  const n = series.length;
  const w = 240;
  const h = 52;
  const padL = 6;
  const padR = 10;
  const padT = 7;
  const padB = 8;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const bottomY = padT + innerH;
  const maxV = Math.max(...series, 1e-6);
  const s = smoothSeries3(series);

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW;
    const y = padT + innerH - (s[i] / maxV) * innerH;
    pts.push({ x, y });
  }

  const defs = `<defs>
<linearGradient id="curveArea" x1="0" y1="${padT}" x2="0" y2="${(bottomY + 2).toFixed(1)}" gradientUnits="userSpaceOnUse">
<stop offset="0%" stop-color="rgb(170,255,220)" stop-opacity="0.42"/>
<stop offset="55%" stop-color="rgb(140,240,210)" stop-opacity="0.14"/>
<stop offset="100%" stop-color="rgb(170,255,220)" stop-opacity="0"/>
</linearGradient>
<linearGradient id="curveLine" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" stop-color="#b8f5df" stop-opacity="0.88"/>
<stop offset="48%" stop-color="#7fe8c8" stop-opacity="0.95"/>
<stop offset="100%" stop-color="#52d4b0" stop-opacity="0.98"/>
</linearGradient>
</defs>`;

  if (pts.length === 0) {
    const y1 = padT + innerH * 0.52;
    const y2 = padT + innerH * 0.5;
    const flatD = `M ${padL} ${y1.toFixed(2)} L ${w - padR} ${y2.toFixed(2)}`;
    const areaD = `${flatD} L ${w - padR} ${bottomY.toFixed(2)} L ${padL} ${bottomY.toFixed(2)} Z`;
    const dotX = (w - padR - 1).toFixed(2);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
${defs}
<path d="${escapeXml(areaD)}" fill="url(#curveArea)" stroke="none"/>
<path d="${escapeXml(flatD)}" fill="none" stroke="url(#curveLine)" stroke-width="1.05" stroke-linecap="round"/>
<circle cx="${dotX}" cy="${y2.toFixed(2)}" r="3.2" fill="rgb(95,220,185)" stroke="rgba(255,255,255,0.55)" stroke-width="0.7"/>
</svg>`;
  }

  if (pts.length === 1) {
    const y = pts[0].y.toFixed(2);
    const flatD = `M ${padL} ${y} L ${w - padR} ${y}`;
    const areaD = `${flatD} L ${w - padR} ${bottomY.toFixed(2)} L ${padL} ${bottomY.toFixed(2)} Z`;
    const dotX = (w - padR - 1).toFixed(2);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
${defs}
<path d="${escapeXml(areaD)}" fill="url(#curveArea)" stroke="none"/>
<path d="${escapeXml(flatD)}" fill="none" stroke="url(#curveLine)" stroke-width="1.1" stroke-linecap="round"/>
<circle cx="${dotX}" cy="${y}" r="3.2" fill="rgb(95,220,185)" stroke="rgba(255,255,255,0.55)" stroke-width="0.7"/>
</svg>`;
  }

  const lineD = buildCurvePathD(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  const areaD = `${lineD} L ${last.x.toFixed(2)} ${bottomY.toFixed(2)} L ${first.x.toFixed(2)} ${bottomY.toFixed(2)} Z`;

  const hi = Math.max(0, Math.min(todayDayIndex, n - 1));
  const cx = pts[hi].x.toFixed(2);
  const cy = pts[hi].y.toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
${defs}
<path d="${escapeXml(areaD)}" fill="url(#curveArea)" stroke="none" opacity="0.92"/>
<path d="${escapeXml(lineD)}" fill="none" stroke="url(#curveLine)" stroke-width="1.12" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="${cx}" cy="${cy}" r="3.2" fill="rgb(95,220,185)" stroke="rgba(255,255,255,0.55)" stroke-width="0.7"/>
</svg>`;
}
