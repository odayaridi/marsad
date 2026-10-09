import { useMemo, useState } from 'react';
import { DISTRICT_SHAPES, LEBANON_OUTLINE, MAP_W, MAP_H } from '../data/lebanonMap';
import { DISTRICT_MAP } from '../data/reference';
import { riskBand } from '../data/seed';
import { cn } from '../lib/utils';

/**
 * Choropleth of Lebanon districts.
 * values: { [districtId]: number 0-100 }
 */
function bboxOf(ids) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of DISTRICT_SHAPES) {
    if (!ids.includes(s.id)) continue;
    const nums = s.d.match(/-?\d+(\.\d+)?/g).map(Number);
    for (let i = 0; i + 1 < nums.length; i += 2) {
      x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]);
      y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
    }
  }
  if (!isFinite(x0)) return null;
  const w = x1 - x0, h = y1 - y0;
  const side = Math.max(w, h * (MAP_W / MAP_H)) * 1.35;
  const vw = side, vh = side * (MAP_H / MAP_W);
  return { x: (x0 + x1) / 2 - vw / 2, y: (y0 + y1) / 2 - vh / 2, w: vw, h: vh };
}

export default function RiskMap({ values, selected, onSelect, className, showLabels = true, dimNonPilot = false, height = 520, markers = [], focus }) {
  const [hover, setHover] = useState(null);
  const vb = useMemo(() => (focus && focus.length ? bboxOf(focus) : null), [focus && focus.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const k = vb ? Math.max(0.35, vb.w / MAP_W) : 1;
  const hv = hover ? DISTRICT_MAP[hover] : null;
  return (
    <div className={cn('relative', className)}>
      <svg viewBox={vb ? `${vb.x} ${vb.y} ${vb.w} ${vb.h}` : `0 0 ${MAP_W} ${MAP_H}`} className="mx-auto block w-full" style={{ maxHeight: height }} role="img" aria-label="Risk map of Lebanon by district">
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="2" />
          </pattern>
          <filter id="mapShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0b2244" floodOpacity="0.12" />
          </filter>
        </defs>
        <path d={LEBANON_OUTLINE} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5 * k} filter="url(#mapShadow)" />
        {DISTRICT_SHAPES.map((s) => {
          const v = values[s.id];
          const band = v === undefined || v === null ? null : riskBand(v);
          const dist = DISTRICT_MAP[s.id];
          const dim = dimNonPilot && !dist.pilot;
          const isSel = selected === s.id;
          return (
            <path
              key={s.id}
              d={s.d}
              fill={band ? band.color : 'url(#hatch)'}
              fillOpacity={dim ? 0.28 : hover === s.id ? 1 : 0.86}
              stroke={isSel ? '#0b2244' : '#ffffff'}
              strokeWidth={(isSel ? 2.5 : 1.1) * k}
              className="cursor-pointer transition-[fill-opacity]"
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(s.id)}
            />
          );
        })}
        {showLabels &&
          DISTRICT_SHAPES.map((s) => {
            const v = values[s.id];
            const dist = DISTRICT_MAP[s.id];
            if (dimNonPilot && !dist.pilot) return null;
            return (
              <g key={s.id + 'l'} pointerEvents="none">
                <text x={s.cx} y={s.cy - 2 * k} textAnchor="middle" fontSize={8.5 * k} fontWeight="600" fill="#0b2244" stroke="#fff" strokeWidth={2.4 * k} paintOrder="stroke">
                  {s.name.length > 11 ? s.name.split(/[- ]/)[0] : s.name}
                </text>
                {v !== undefined && v !== null && (
                  <text x={s.cx} y={s.cy + 8 * k} textAnchor="middle" fontSize={8 * k} fill="#334155" stroke="#fff" strokeWidth={2.2 * k} paintOrder="stroke">
                    {v}
                  </text>
                )}
              </g>
            );
          })}
        {markers.map((m) => {
          const s = DISTRICT_SHAPES.find((x) => x.id === m.district);
          if (!s) return null;
          return (
            <g key={m.id} pointerEvents="none" transform={`translate(${s.cx + 14 * k}, ${s.cy - 14 * k}) scale(${k})`}>
              <circle r="7" fill="#be123c" stroke="#fff" strokeWidth="2" />
              <circle r="7" fill="none" stroke="#be123c" strokeWidth="2" opacity="0.5">
                <animate attributeName="r" from="7" to="15" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.5" to="0" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <text textAnchor="middle" y="3" fontSize="8" fontWeight="700" fill="#fff">!</text>
            </g>
          );
        })}
      </svg>
      {hv && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-pop backdrop-blur">
          <div className="font-semibold text-slate-900">{hv.name}</div>
          <div className="text-slate-500">{hv.governorate} governorate{hv.pilot ? ' · pilot network' : ''}</div>
          {values[hover] !== undefined && values[hover] !== null ? (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: riskBand(values[hover]).color }} />
              Risk score <b className="text-slate-800">{values[hover]}</b> · {riskBand(values[hover]).label}
            </div>
          ) : (
            <div className="mt-1 text-slate-400">No partner data yet</div>
          )}
        </div>
      )}
    </div>
  );
}

export function RiskLegend({ className }) {
  const items = [
    { label: 'Low < 35', color: '#5fb3a5' },
    { label: 'Moderate 35–49', color: '#e6b93a' },
    { label: 'Elevated 50–69', color: '#e07a2f' },
    { label: 'High ≥ 70', color: '#c2334b' },
  ];
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600', className)}>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
