import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BedDouble, Minus, Plus, ShoppingCart, PackageCheck, Users, AlertTriangle, CheckCircle2, Truck, Search } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Tabs, Button, Badge, Modal, Field, Input, PageSkeleton, Stat, ConditionTag, Segmented, Th } from '../components/ui';
import { useSimulatedLoad } from '../lib/hooks';
import { STAFF_ROLES, MY_HOSPITAL } from '../data/seed';
import { CONDITION_MAP } from '../data/reference';
import { TODAY, addDays, fmtShort, fmtRelative, cn, mulberry32 } from '../lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';

function stockStatus(s) {
  const cover = (s.onHand + (s.onOrder || 0)) / s.projectedUse;
  if (cover < s.leadTimeDays) return { id: 'critical', label: 'Critical', cls: 'bg-rose-50 text-rose-700 ring-rose-200', cover };
  if (cover < s.leadTimeDays + 7) return { id: 'low', label: 'Order now', cls: 'bg-amber-50 text-amber-700 ring-amber-200', cover };
  return { id: 'ok', label: 'Covered', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', cover };
}

function wardSeries(w) {
  return Array.from({ length: 15 }, (_, i) => {
    const t = i / 14;
    const bump = Math.sin(Math.min(1, t * 1.6) * Math.PI) * (w.forecastPeak - w.occupied) + (w.forecastPeak - w.occupied) * 0.3 * t;
    return { day: fmtShort(addDays(TODAY, i)), occ: Math.round(w.occupied + bump) };
  });
}

function BedsTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [sel, setSel] = useState(state.wards[1].id);
  const ward = state.wards.find((w) => w.id === sel);
  const series = useMemo(() => wardSeries(ward), [ward]);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {state.wards.map((w) => {
          const peakPct = Math.round((w.forecastPeak / w.beds) * 100);
          const free = w.beds - w.occupied - w.reserved;
          return (
            <Card key={w.id} className={cn('cursor-pointer p-4 transition hover:shadow-md', sel === w.id && 'ring-2 ring-teal-300')} onClick={() => setSel(w.id)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900">{w.name}</div>
                  {w.condition && <div className="mt-1"><ConditionTag id={w.condition} size="sm" /></div>}
                </div>
                <Badge className={peakPct >= 100 ? 'bg-rose-50 text-rose-700 ring-rose-200' : peakPct >= 90 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}>Peak {peakPct}%</Badge>
              </div>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="bg-navy-700" style={{ width: `${(w.occupied / w.beds) * 100}%` }} title="Occupied" />
                <div className="bg-teal-400" style={{ width: `${(w.reserved / w.beds) * 100}%` }} title="Reserved" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span><b className="text-slate-800">{w.occupied}</b> occupied</span>
                <span><b className="text-teal-700">{w.reserved}</b> reserved</span>
                <span><b className="text-slate-800">{Math.max(0, free)}</b> free / {w.beds}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-slate-500">Reserve for surge</span>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Release a bed" disabled={w.reserved === 0} className="flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40" onClick={() => dispatch({ type: 'WARD_RESERVE', id: w.id, reserved: w.reserved - 1 })}><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-7 text-center text-sm font-semibold tabular">{w.reserved}</span>
                  <button type="button" aria-label="Reserve a bed" disabled={free <= 0} className="flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40" onClick={() => { dispatch({ type: 'WARD_RESERVE', id: w.id, reserved: w.reserved + 1 }); toast(`Bed reserved in ${w.name}`); }}><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader title={`Projected occupancy · ${ward.name}`} subtitle="Next 14 days, based on the admissions forecast for your catchment" />
        <div className="h-[260px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <defs><linearGradient id="occ" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1f6fbe" stopOpacity={0.35} /><stop offset="100%" stopColor="#1f6fbe" stopOpacity={0.05} /></linearGradient></defs>
              <CartesianGrid stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} domain={[0, Math.max(ward.beds + 4, ward.forecastPeak + 2)]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v) => [`${v} patients`, 'Projected']} />
              <ReferenceLine y={ward.beds} stroke="#e11d48" strokeDasharray="4 4" label={{ value: `Capacity ${ward.beds}`, position: 'insideTopRight', fontSize: 11, fill: '#e11d48' }} />
              <ReferenceLine y={ward.beds - ward.reserved} stroke="#2fb7a4" strokeDasharray="3 3" label={ward.reserved ? { value: 'Reserved buffer', position: 'insideBottomRight', fontSize: 10, fill: '#107d71' } : undefined} />
              <Area type="monotone" dataKey="occ" stroke="#1f6fbe" strokeWidth={2} fill="url(#occ)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function StockTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [orderFor, setOrderFor] = useState(null);
  const [qty, setQty] = useState(0);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const rows = state.stock
    .map((s) => ({ ...s, st: stockStatus(s) }))
    .filter((s) => (filter === 'all' ? true : filter === 'risk' ? s.st.id !== 'ok' : s.category === filter))
    .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.st.cover - b.st.cover);
  const open = (s) => { setOrderFor(s); setQty(Math.max(0, Math.round(s.projectedUse * 21 - s.onHand - (s.onOrder || 0)))); };
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search medicines…" className="w-full sm:w-56" />
        <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'risk', label: 'At risk' }, { value: 'diabetes', label: 'Diabetes' }, { value: 'cardiac', label: 'Cardiac' }, { value: 'respiratory', label: 'Respiratory' }]} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50/60"><tr><Th>Item</Th><Th className="text-right">On hand</Th><Th className="text-right">On order</Th><Th className="text-right">Daily use now → forecast</Th><Th className="text-right">Days of cover</Th><Th className="text-right">Lead time</Th><Th>Status</Th><Th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((s) => (
              <tr key={s.id} className={s.st.id === 'critical' ? 'bg-rose-50/30' : ''}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{s.name}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">{CONDITION_MAP[s.category] ? <ConditionTag id={s.category} size="sm" /> : 'General'} · {s.supplier}{s.shortage && <Badge className="bg-rose-50 text-rose-700 ring-rose-200">National shortage</Badge>}</div>
                </td>
                <td className="px-4 py-3 text-right tabular">{s.onHand} <span className="text-xs text-slate-400">{s.unit}</span></td>
                <td className="px-4 py-3 text-right tabular text-teal-700">{s.onOrder ? `+${s.onOrder}` : '—'}</td>
                <td className="px-4 py-3 text-right tabular">{s.dailyUse} → <b className={s.projectedUse > s.dailyUse * 1.2 ? 'text-rose-600' : ''}>{s.projectedUse}</b></td>
                <td className="px-4 py-3 text-right">
                  <div className="font-semibold tabular text-navy-900">{s.st.cover.toFixed(1)} d</div>
                  <div className="ml-auto mt-1 h-1.5 w-20 rounded-full bg-slate-100"><div className={cn('h-full rounded-full', s.st.id === 'critical' ? 'bg-rose-500' : s.st.id === 'low' ? 'bg-amber-500' : 'bg-teal-500')} style={{ width: `${Math.min(100, (s.st.cover / 21) * 100)}%` }} /></div>
                </td>
                <td className="px-4 py-3 text-right tabular text-slate-600">{s.leadTimeDays} d</td>
                <td className="px-4 py-3"><Badge className={s.st.cls}>{s.st.label}</Badge>{s.lastOrder && <div className="mt-1 text-[11px] text-slate-400">ordered {fmtRelative(s.lastOrder)}</div>}</td>
                <td className="px-4 py-3 text-right"><Button size="xs" variant={s.st.id === 'ok' ? 'secondary' : 'primary'} icon={ShoppingCart} onClick={() => open(s)}>Order</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={!!orderFor}
        onClose={() => setOrderFor(null)}
        icon={Truck}
        title="Place purchase order"
        subtitle={orderFor?.name}
        size="sm"
        footer={
          <>
            <Button onClick={() => setOrderFor(null)}>Cancel</Button>
            <Button variant="primary" disabled={qty <= 0} onClick={() => { dispatch({ type: 'STOCK_ORDER', id: orderFor.id, qty: Number(qty) }); toast('Order placed', { desc: `${qty} ${orderFor.unit} · ETA ${orderFor.leadTimeDays} days` }); setOrderFor(null); }}>Confirm order</Button>
          </>
        }
      >
        {orderFor && (
          <div className="space-y-4">
            <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800">Suggested quantity covers <b>21 days</b> at the forecast usage of {orderFor.projectedUse} {orderFor.unit}/day, which avoids a panic order later.</div>
            <Field label={`Quantity (${orderFor.unit})`}><Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
            <div className="text-xs text-slate-500">Supplier: {orderFor.supplier} · lead time {orderFor.leadTimeDays} days{orderFor.shortage ? ' · national shortage: consider alternatives (e.g. nebulised salbutamol).' : ''}</div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function StaffTab() {
  const { dispatch } = useStore();
  const toast = useToast();
  const [requested, setRequested] = useState({});
  const days = Array.from({ length: 14 }, (_, i) => addDays(TODAY, i + 1));
  const r = mulberry32(99);
  const grid = useMemo(
    () =>
      STAFF_ROLES.map((role) => ({
        role,
        cells: days.map((d, i) => {
          const surge = i >= 3 && i <= 9 ? (role.id === 'rt' ? 1 : Math.ceil(role.base * 0.18)) : 0;
          const weekend = [0, 6].includes(d.getDay());
          const scheduled = role.base - (weekend && r() > 0.4 ? 1 : 0);
          return { date: d, scheduled, recommended: role.base + surge };
        }),
      })),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const gaps = grid.reduce((s, g) => s + g.cells.filter((c, i) => c.recommended > c.scheduled && !requested[`${g.role.id}-${i}`]).length, 0);
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Staff rota vs. recommended cover" subtitle="Recommended staffing rises on forecast peak days. Click a gap to request an extra shift." actions={<Badge className={gaps ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}>{gaps} gaps</Badge>} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-xs">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-500">Role</th>
              {days.map((d, i) => <th key={i} className={cn('px-1 py-2.5 text-center font-medium', i >= 3 && i <= 9 ? 'text-rose-600' : 'text-slate-500')}>{d.toLocaleDateString('en-GB', { weekday: 'short' })}<div className="font-normal">{d.getDate()}</div></th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grid.map((g) => (
              <tr key={g.role.id}>
                <td className="sticky left-0 bg-white px-4 py-2 text-[13px] font-medium text-slate-700">{g.role.label}</td>
                {g.cells.map((c, i) => {
                  const k = `${g.role.id}-${i}`;
                  const gap = c.recommended > c.scheduled;
                  const req = requested[k];
                  return (
                    <td key={i} className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        disabled={!gap || req}
                        onClick={() => {
                          setRequested((x) => ({ ...x, [k]: true }));
                          dispatch({ type: 'AUDIT', action: 'CREATE', object: 'Shift request', detail: `${g.role.label} · ${fmtShort(c.date)} · +${c.recommended - c.scheduled}` });
                          toast('Extra shift requested', { desc: `${g.role.label} · ${fmtShort(c.date)}` });
                        }}
                        className={cn('h-9 w-full min-w-[42px] rounded-md text-[13px] font-semibold tabular', req ? 'bg-teal-100 text-teal-800' : gap ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-50 text-slate-600')}
                        title={gap ? `Scheduled ${c.scheduled}, recommended ${c.recommended}` : `Scheduled ${c.scheduled}`}
                      >
                        {req ? c.recommended : c.scheduled}{gap && !req && <span className="text-[10px] font-normal">/{c.recommended}</span>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100" /> Gap (scheduled/recommended)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-teal-100" /> Extra shift requested</span>
        <span className="flex items-center gap-1.5 text-rose-600">Red dates = forecast peak window</span>
      </div>
    </Card>
  );
}

export default function Readiness() {
  const { state } = useStore();
  const loading = useSimulatedLoad(450);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'beds';
  if (loading) return <PageSkeleton />;
  const beds = state.wards.reduce((s, w) => s + w.beds, 0);
  const occ = state.wards.reduce((s, w) => s + w.occupied, 0);
  const reserved = state.wards.reduce((s, w) => s + w.reserved, 0);
  const peak = state.wards.reduce((s, w) => s + w.forecastPeak, 0);
  const atRisk = state.stock.filter((s) => stockStatus(s).id !== 'ok').length;
  const critical = state.stock.filter((s) => stockStatus(s).id === 'critical').length;
  return (
    <div>
      <PageHeader eyebrow="Act" title="Readiness" subtitle={`${MY_HOSPITAL.name} · beds, medicines and staff measured against the 14-day forecast. No more panic orders.`} />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Bed occupancy now" value={`${Math.round((occ / beds) * 100)}%`} sub={`${occ} of ${beds} beds`} icon={BedDouble} tone="brand" />
        <Stat label="Forecast peak occupancy" value={`${Math.round((peak / beds) * 100)}%`} sub="Days +5 to +8" icon={AlertTriangle} tone={peak / beds > 0.9 ? 'rose' : 'amber'} />
        <Stat label="Beds reserved for surge" value={reserved} sub="Across all wards" icon={CheckCircle2} tone="teal" />
        <Stat label="Medicines at risk" value={atRisk} sub={`${critical} critical (cover < lead time)`} icon={PackageCheck} tone={critical ? 'rose' : 'amber'} />
      </div>
      <Tabs className="mb-4" value={tab} onChange={(t) => setParams({ tab: t })} tabs={[{ id: 'beds', label: 'Beds' }, { id: 'stock', label: 'Medicines & supplies', count: atRisk }, { id: 'staff', label: 'Staff rota' }]} />
      {tab === 'beds' && <BedsTab />}
      {tab === 'stock' && <StockTab />}
      {tab === 'staff' && <StaffTab />}
    </div>
  );
}
