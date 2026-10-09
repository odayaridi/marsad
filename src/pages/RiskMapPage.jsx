import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, TrendingUp, Building2, ArrowRight, Info } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { Card, CardHeader, PageHeader, Segmented, Select, ConditionTag, Badge, EmptyState, PageSkeleton, Button, Progress } from '../components/ui';
import RiskMap, { RiskLegend } from '../components/RiskMap';
import { AlertRow } from '../components/alerts';
import { useSimulatedLoad } from '../lib/hooks';
import { riskScore, overallRisk, riskBand } from '../data/seed';
import { CONDITIONS, CONDITION_MAP, AGE_GROUPS, DISTRICTS, DISTRICT_MAP, PARTNER_TYPES, PILOT_DISTRICTS } from '../data/reference';
import { fmtNum, cn } from '../lib/utils';

export default function RiskMapPage() {
  const { state } = useStore();
  const loading = useSimulatedLoad(500);
  const [params, setParams] = useSearchParams();
  const [cond, setCond] = useState('all');
  const [age, setAge] = useState('all');
  const [horizon, setHorizon] = useState(14);
  const [scope, setScope] = useState('pilot');
  const selected = params.get('district') || 'baabda';

  const values = useMemo(() => {
    const v = {};
    for (const d of DISTRICTS) {
      if (scope === 'pilot' && !d.pilot) continue;
      v[d.id] = cond === 'all' ? overallRisk(d.id, age, horizon) : riskScore(d.id, cond, age, horizon);
    }
    return v;
  }, [cond, age, horizon, scope]);

  const ranked = useMemo(() => Object.entries(values).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v), [values]);

  if (loading) return <PageSkeleton />;

  const dist = DISTRICT_MAP[selected];
  const alerts = state.alerts.filter((a) => a.district === selected && ['new', 'acknowledged', 'action_planned'].includes(a.status));
  const partners = state.partners.filter((p) => p.district === selected);
  const select = (id) => setParams({ district: id });

  return (
    <div>
      <PageHeader eyebrow="Detect" title="Risk map" subtitle="Where chronic-disease risk is rising, by district, condition and age group, over the next 7 or 14 days." />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-3">
          <Segmented value={cond} onChange={setCond} options={[{ value: 'all', label: 'All conditions' }, ...CONDITIONS.map((c) => ({ value: c.id, label: c.label }))]} />
          <Select value={age} onChange={(e) => setAge(e.target.value)} options={[{ value: 'all', label: 'All age groups' }, ...AGE_GROUPS.map((g) => ({ value: g.id, label: `Age ${g.label}` }))]} className="w-40" />
          <Segmented value={horizon} onChange={setHorizon} options={[{ value: 7, label: 'Next 7 days' }, { value: 14, label: 'Next 14 days' }]} />
          <Segmented value={scope} onChange={setScope} options={[{ value: 'pilot', label: 'Pilot network' }, { value: 'national', label: 'All Lebanon' }]} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title={cond === 'all' ? 'Highest risk across conditions' : `${CONDITION_MAP[cond].label} risk`} subtitle={`Risk score 0–100 · ${age === 'all' ? 'all ages' : `age ${AGE_GROUPS.find((g) => g.id === age).label}`} · ${horizon}-day horizon · click a district`} />
          <div className="p-4">
            <RiskMap values={values} selected={selected} onSelect={select} height={620} focus={scope === 'pilot' ? PILOT_DISTRICTS : undefined} markers={state.alerts.filter((a) => a.status === 'new' && a.severity === 'high' && values[a.district] !== undefined).map((a) => ({ id: a.id, district: a.district }))} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <RiskLegend />
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-700" /> New high alert</span>
            </div>
            {scope === 'national' && <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Outside the pilot network, scores rely on pharmacy refills and public feeds only, so confidence is lower.</div>}
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><MapPin className="h-3.5 w-3.5" />{dist.governorate} governorate</div>
                  <div className="mt-1 text-xl font-bold text-navy-900">{dist.name}</div>
                  <div className="text-xs text-slate-500">Population ≈ {fmtNum(dist.population)} · {dist.pilot ? 'Pilot network' : 'Outside pilot'}</div>
                </div>
                {values[selected] !== undefined ? (
                  <div className="text-right">
                    <div className="text-3xl font-extrabold" style={{ color: riskBand(values[selected]).color }}>{values[selected]}</div>
                    <div className="text-xs font-semibold" style={{ color: riskBand(values[selected]).color }}>{riskBand(values[selected]).label}</div>
                  </div>
                ) : <Badge>Not in view</Badge>}
              </div>
              <div className="mt-5 space-y-3">
                {CONDITIONS.map((c) => {
                  const s = riskScore(selected, c.id, age, horizon);
                  return (
                    <div key={c.id}>
                      <div className="mb-1 flex items-center justify-between text-sm"><ConditionTag id={c.id} size="sm" /><span className="font-semibold tabular" style={{ color: riskBand(s).color }}>{s}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${s}%`, background: riskBand(s).color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/app/forecasts?district=${selected}`}><Button size="sm" icon={TrendingUp}>Forecast</Button></Link>
                <Link to={`/app/signals?district=${selected}`}><Button size="sm">Early signals</Button></Link>
                <Link to={`/app/alerts?district=${selected}&tab=all`}><Button size="sm" variant="ghost" iconRight={ArrowRight}>All alerts</Button></Link>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={`Active alerts in ${dist.name}`} subtitle={`${alerts.length} active`} />
            <div className="space-y-2 p-3">
              {alerts.length ? alerts.map((a) => <AlertRow key={a.id} a={a} compact />) : <EmptyState title="No active alerts" desc="Risk is within the normal seasonal range." className="py-8" />}
            </div>
          </Card>

          <Card>
            <CardHeader title="Data coverage" subtitle="Partners contributing data for this district" icon={Building2} />
            <div className="divide-y divide-slate-100">
              {partners.length ? partners.map((p) => (
                <Link key={p.id} to={`/app/network?partner=${p.id}`} className="flex items-center justify-between px-5 py-2.5 text-sm hover:bg-slate-50">
                  <span className="text-slate-700">{p.name}</span>
                  <span className="text-xs text-slate-400">{PARTNER_TYPES[p.type].label}</span>
                </Link>
              )) : <div className="px-5 py-4 text-sm text-slate-500">No direct partners yet. Estimates come from the pharmacy network and public feeds.</div>}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="District ranking" subtitle="Sorted by current risk score" />
        <div className="grid gap-x-8 gap-y-1 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((r, i) => (
            <button type="button" key={r.id} onClick={() => select(r.id)} className={cn('flex items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50', r.id === selected && 'bg-brand-50')}>
              <span className="w-5 text-xs text-slate-400">{i + 1}</span>
              <span className="flex-1 text-slate-700">{DISTRICT_MAP[r.id].name}</span>
              <span className="h-1.5 w-24 rounded-full bg-slate-100"><span className="block h-full rounded-full" style={{ width: `${r.v}%`, background: riskBand(r.v).color }} /></span>
              <span className="w-7 text-right font-semibold tabular" style={{ color: riskBand(r.v).color }}>{r.v}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
