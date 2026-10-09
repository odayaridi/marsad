import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Gauge, Target, Timer, Layers } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Segmented, Select, Button, Stat, PageSkeleton, ConditionTag } from '../components/ui';
import { ForecastChart, ForecastLegend, SimpleBars } from '../components/charts';
import { useSimulatedLoad } from '../lib/hooks';
import { getSeries, SEED_ALERTS } from '../data/seed';
import { CONDITIONS, CONDITION_MAP, DISTRICTS, DISTRICT_MAP, PILOT_DISTRICTS } from '../data/reference';
import { fmtWeekday, toCSV, downloadText, cn } from '../lib/utils';

export default function Forecasts() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const loading = useSimulatedLoad(500);
  const [params] = useSearchParams();
  const [area, setArea] = useState(params.get('district') || 'catchment');
  const [cond, setCond] = useState('all');
  const [horizon, setHorizon] = useState(14);

  const ids = area === 'catchment' ? state.settings.catchment : area === 'pilot' ? PILOT_DISTRICTS : [area];
  const areaLabel = area === 'catchment' ? 'My catchment' : area === 'pilot' ? 'Pilot network' : DISTRICT_MAP[area]?.name;
  const color = cond === 'all' ? '#179c8b' : CONDITION_MAP[cond].color;
  const series = useMemo(() => getSeries(ids, cond).filter((d) => d.off <= horizon), [ids.join(), cond, horizon]); // eslint-disable-line react-hooks/exhaustive-deps
  const perCond = useMemo(() => CONDITIONS.map((c) => ({ c, s: getSeries(ids, c.id, { past: 14 }).filter((d) => d.off <= horizon) })), [ids.join(), horizon]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSkeleton />;

  const future = series.filter((d) => d.off > 0);
  const total = future.reduce((s, d) => s + d.forecast, 0);
  const base = future.reduce((s, d) => s + d.baseline, 0);
  const peak = future.reduce((m, d) => (d.forecast > m.forecast ? d : m), future[0]);
  const resolved = SEED_ALERTS.filter((a) => a.outcome);

  const exportCsv = () => {
    const csv = toCSV(future, [
      { label: 'Date', value: (d) => d.date.slice(0, 10) }, { label: 'Day', value: 'off' }, { label: 'Forecast admissions', value: 'forecast' },
      { label: 'Lower 80%', value: 'lower' }, { label: 'Upper 80%', value: 'upper' }, { label: 'Seasonal baseline', value: 'baseline' },
    ]);
    downloadText(`marsad-forecast-${area}-${cond}.csv`, csv, 'text/csv');
    dispatch({ type: 'AUDIT', action: 'EXPORT', object: 'Forecast', detail: `${areaLabel} · ${cond} · ${horizon} days` });
    toast('Forecast exported');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Detect"
        title="Admissions forecasts"
        subtitle="Daily chronic-disease admissions per district, 7–14 days ahead, with 80% prediction intervals."
        actions={<Button icon={Download} onClick={exportCsv}>Export CSV</Button>}
      />
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-3">
          <Select value={area} onChange={(e) => setArea(e.target.value)} className="w-52" options={[{ value: 'catchment', label: 'My catchment (4 districts)' }, { value: 'pilot', label: 'Whole pilot network' }, ...DISTRICTS.filter((d) => d.pilot).map((d) => ({ value: d.id, label: d.name })), ...DISTRICTS.filter((d) => !d.pilot).map((d) => ({ value: d.id, label: `${d.name} (outside pilot)` }))]} />
          <Segmented value={cond} onChange={setCond} options={[{ value: 'all', label: 'All conditions' }, ...CONDITIONS.map((c) => ({ value: c.id, label: c.label }))]} />
          <Segmented value={horizon} onChange={setHorizon} options={[{ value: 7, label: '7 days' }, { value: 14, label: '14 days' }]} />
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={`Expected admissions · ${horizon} d`} value={Math.round(total)} sub={`Baseline ${Math.round(base)}`} icon={Layers} tone="brand" />
        <Stat label="Above baseline" value={`${total >= base ? '+' : ''}${Math.round(((total - base) / base) * 100)}%`} sub={areaLabel} icon={Gauge} tone={total > base * 1.1 ? 'rose' : 'teal'} />
        <Stat label="Peak day" value={peak ? fmtWeekday(peak.date) : '—'} sub={peak ? `${peak.forecast} admissions (${peak.lower}–${peak.upper})` : ''} icon={Target} tone="amber" />
        <Stat label="Median lead time" value="9 days" sub="Back-test, 14 past surges" icon={Timer} tone="violet" />
      </div>

      <Card className="mb-4">
        <CardHeader title={`${cond === 'all' ? 'All chronic conditions' : CONDITION_MAP[cond].label} · ${areaLabel}`} subtitle="28 days observed, then forecast" />
        <div className="p-5">
          <ForecastChart data={series} color={color} height={340} />
          <div className="mt-3"><ForecastLegend color={color} /></div>
        </div>
      </Card>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        {perCond.map(({ c, s }) => {
          const f = s.filter((d) => d.off > 0);
          const t = f.reduce((x, d) => x + d.forecast, 0);
          const b = f.reduce((x, d) => x + d.baseline, 0);
          const pct = Math.round(((t - b) / b) * 100);
          return (
            <Card key={c.id} className={cn('cursor-pointer transition hover:shadow-md', cond === c.id && 'ring-2 ring-teal-300')} onClick={() => setCond(c.id)}>
              <div className="flex items-center justify-between px-4 pt-4">
                <ConditionTag id={c.id} />
                <span className={cn('text-sm font-bold', pct >= 15 ? 'text-rose-600' : pct >= 5 ? 'text-amber-600' : 'text-teal-600')}>{pct >= 0 ? '+' : ''}{pct}%</span>
              </div>
              <div className="px-2 pb-2"><ForecastChart data={s} color={c.color} height={150} compact /></div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-3">
          <CardHeader title="Daily forecast table" subtitle={`${areaLabel} · next ${horizon} days`} />
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5 text-right">Forecast</th><th className="px-4 py-2.5 text-right">80% interval</th><th className="px-4 py-2.5 text-right">Baseline</th><th className="px-4 py-2.5 text-right">Δ</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {future.map((d) => {
                  const delta = Math.round(((d.forecast - d.baseline) / d.baseline) * 100);
                  return (
                    <tr key={d.off} className={d.off === peak?.off ? 'bg-amber-50/60' : ''}>
                      <td className="px-4 py-2 text-slate-700">{fmtWeekday(d.date)} <span className="text-xs text-slate-400">+{d.off}</span></td>
                      <td className="px-4 py-2 text-right font-semibold tabular text-navy-900">{d.forecast}</td>
                      <td className="px-4 py-2 text-right tabular text-slate-500">{d.lower} – {d.upper}</td>
                      <td className="px-4 py-2 text-right tabular text-slate-500">{d.baseline}</td>
                      <td className={cn('px-4 py-2 text-right font-medium tabular', delta >= 20 ? 'text-rose-600' : delta >= 8 ? 'text-amber-600' : 'text-slate-500')}>{delta >= 0 ? '+' : ''}{delta}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="How accurate has Marsad been?" subtitle="Forecast vs. observed rise for resolved alerts" />
          <div className="p-5">
            <SimpleBars data={resolved.map((a) => ({ name: `${a.id} ${DISTRICT_MAP[a.district].name}`, Forecast: a.rise, Observed: a.outcome.observedRise }))} xKey="name" bars={[{ key: 'Forecast', label: 'Forecast rise %', color: '#97e3d6' }, { key: 'Observed', label: 'Observed rise %', color: '#0e2a52' }]} height={200} />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[['14%', 'Back-test MAPE'], ['78%', 'Alert precision'], ['9 d', 'Median lead time']].map(([v, l]) => (
                <div key={l} className="rounded-lg bg-slate-50 p-2.5"><div className="text-lg font-bold text-navy-900">{v}</div><div className="text-[11px] text-slate-500">{l}</div></div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Observed rises can be lower than forecast when actions succeed (e.g. PHC outreach in Chouf, A-1033). Marsad tracks this as “avoided admissions” in the impact report.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
