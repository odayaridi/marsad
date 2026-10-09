import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, LineChart, BarChart, Bar, Legend, Cell,
} from 'recharts';
import { fmtShort, fmtWeekday } from '../lib/utils';

const axis = { fontSize: 11, fill: '#64748b' };

function ForecastTip({ active, payload, label, unit = 'admissions/day' }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      <div className="mb-1 font-semibold text-slate-800">
        {fmtWeekday(label)} {p.off === 0 ? '· today' : p.off > 0 ? `· day +${p.off}` : ''}
      </div>
      {p.actual !== null && p.actual !== undefined && <Row c="#0e2a52" k="Observed" v={p.actual} />}
      {p.off > 0 && p.forecast !== null && <Row c="#179c8b" k="Forecast" v={p.forecast} />}
      {p.band && p.off > 0 && <Row c="#97e3d6" k="80% interval" v={`${p.band[0]} – ${p.band[1]}`} />}
      <Row c="#94a3b8" k="Seasonal baseline" v={p.baseline} />
      <div className="mt-1 text-[10px] text-slate-400">{unit}</div>
    </div>
  );
}
function Row({ c, k, v }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-slate-500">
        <span className="h-2 w-2 rounded-full" style={{ background: c }} />
        {k}
      </span>
      <span className="font-semibold text-slate-800">{v}</span>
    </div>
  );
}

export function ForecastChart({ data, height = 260, windowStart, windowEnd, color = '#179c8b', compact = false }) {
  const today = data.find((d) => d.off === 0)?.date;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, left: compact ? -24 : -8, bottom: 0 }}>
          <defs>
            <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtShort} tick={axis} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} minTickGap={28} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<ForecastTip />} />
          {windowStart && windowEnd && <ReferenceArea x1={windowStart} x2={windowEnd} fill="#fde68a" fillOpacity={0.22} stroke="#f59e0b" strokeOpacity={0.25} strokeDasharray="3 3" />}
          <Area type="monotone" dataKey="band" stroke="none" fill="url(#bandFill)" isAnimationActive={false} />
          <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={1.25} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="actual" stroke="#0e2a52" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="forecast" stroke={color} strokeWidth={2.25} strokeDasharray="6 3" dot={false} isAnimationActive={false} connectNulls />
          {today && <ReferenceLine x={today} stroke="#0e2a52" strokeOpacity={0.5} label={compact ? undefined : { value: 'Today', position: 'insideTopRight', fontSize: 10, fill: '#475569' }} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForecastLegend({ color = '#179c8b', showWindow }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-navy-800" /> Observed</span>
      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: color }} /> Forecast</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm" style={{ background: color, opacity: 0.25 }} /> 80% interval</span>
      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed border-slate-400" /> Seasonal baseline</span>
      {showWindow && <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-amber-200" /> Alert window</span>}
    </div>
  );
}

export function Sparkline({ data, color = '#1f6fbe', height = 36, dataKey }) {
  const rows = dataKey ? data : data.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey={dataKey || 'v'} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ data, lines, height = 220, xKey = 'date', yUnit = '' }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={(v) => (typeof v === 'string' && v.includes('T') ? fmtShort(v) : v)} tick={axis} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} minTickGap={24} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={44} unit={yUnit} />
          <Tooltip labelFormatter={(v) => (typeof v === 'string' && v.includes('T') ? `Week of ${fmtShort(v)}` : v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2} strokeDasharray={l.dashed ? '5 4' : undefined} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBars({ data, bars, height = 220, xKey, layout = 'horizontal', colors, yWidth = 44, stacked }) {
  const vertical = layout === 'vertical';
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ top: 8, right: 12, left: vertical ? 4 : -8, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f6" vertical={vertical} horizontal={!vertical} />
          {vertical ? (
            <>
              <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey={xKey} tick={axis} tickLine={false} axisLine={false} width={yWidth} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={axis} tickLine={false} axisLine={false} width={44} />
            </>
          )}
          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
          {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={28} stackId={stacked ? 's' : undefined} isAnimationActive={false}>
              {colors && data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StressorChart({ data, dataKey, color, threshold, unit, height = 120, invert }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={(v) => fmtShort(v).split(' ')[0]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={1} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} labelFormatter={fmtWeekday} formatter={(v) => [`${v} ${unit}`, '']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
          {threshold !== undefined && <ReferenceLine y={threshold} stroke="#e11d48" strokeDasharray="3 3" />}
          <Bar dataKey={dataKey} radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((d, i) => {
              const hot = invert ? d[dataKey] <= threshold : d[dataKey] >= threshold;
              return <Cell key={i} fill={hot ? color : '#cbd5e1'} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
