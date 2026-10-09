import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, MapPinned, BellRing, Users, Download, FileText, Info } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Button, Stat, Segmented, PageSkeleton, Badge, ConditionTag, Th } from '../components/ui';
import RiskMap, { RiskLegend } from '../components/RiskMap';
import { ForecastChart, ForecastLegend } from '../components/charts';
import { AlertRow } from '../components/alerts';
import { useSimulatedLoad } from '../lib/hooks';
import { riskScore, overallRisk, riskBand, getSeries } from '../data/seed';
import { CONDITIONS, CONDITION_MAP, DISTRICTS, PILOT_DISTRICTS } from '../data/reference';
import { fmtNum, fmtMoney, downloadText, TODAY, fmtLongDate, cn } from '../lib/utils';

export default function National() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const loading = useSimulatedLoad(500);
  const [cond, setCond] = useState('all');
  const values = useMemo(() => Object.fromEntries(DISTRICTS.map((d) => [d.id, cond === 'all' ? overallRisk(d.id) : riskScore(d.id, cond)])), [cond]);
  const series = useMemo(() => getSeries(DISTRICTS.map((d) => d.id), cond), [cond]);
  const govs = useMemo(() => {
    const g = {};
    for (const d of DISTRICTS) {
      g[d.governorate] = g[d.governorate] || { name: d.governorate, pop: 0, districts: [], pilot: 0 };
      g[d.governorate].pop += d.population;
      g[d.governorate].districts.push(d.id);
      if (d.pilot) g[d.governorate].pilot++;
    }
    return Object.values(g).map((x) => ({ ...x, risk: Object.fromEntries(CONDITIONS.map((c) => [c.id, Math.round(x.districts.reduce((s, id) => s + riskScore(id, c.id) * DISTRICTS.find((d) => d.id === id).population, 0) / x.pop)])) })).sort((a, b) => Math.max(...Object.values(b.risk)) - Math.max(...Object.values(a.risk)));
  }, []);

  if (loading) return <PageSkeleton />;

  const active = state.alerts.filter((a) => ['new', 'acknowledged', 'action_planned'].includes(a.status));
  const elevated = Object.values(values).filter((v) => v >= 50).length;
  const covered = DISTRICTS.filter((d) => d.pilot).reduce((s, d) => s + d.population, 0);
  const totalPop = DISTRICTS.reduce((s, d) => s + d.population, 0);
  const licence = state.licences.find((l) => l.buyer.includes('Ministry'));

  const bulletin = () => {
    const lines = [
      `Marsad weekly chronic-disease bulletin, ${fmtLongDate(TODAY)}`,
      '',
      `Active alerts: ${active.length}. Districts at elevated risk or higher: ${elevated}.`,
      '',
      ...active.map((a) => `- ${a.id} ${a.title} (+${a.rise}%, confidence ${Math.round(a.confidence * 100)}%)`),
      '',
      'District-level aggregates only. No patient-identifiable information.',
    ];
    downloadText('marsad-moph-weekly-bulletin.txt', lines.join('\n'));
    dispatch({ type: 'AUDIT', action: 'EXPORT', object: 'MoPH weekly bulletin', detail: 'District aggregates' });
    toast('Weekly bulletin downloaded');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Overview · Ministry of Public Health"
        title="National overview"
        subtitle="District-level chronic-disease risk across Lebanon. Complements national infectious-disease surveillance; never patient-level data."
        actions={<><Button icon={Download} onClick={bulletin}>Weekly bulletin</Button><Link to="/app/reports"><Button variant="primary" icon={FileText}>Impact reports</Button></Link></>}
      />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active alerts nationwide" value={active.length} sub={`${active.filter((a) => a.severity === 'high').length} high severity`} icon={BellRing} tone="rose" onClick={() => navigate('/app/alerts')} />
        <Stat label="Districts at elevated risk+" value={`${elevated}/${DISTRICTS.length}`} sub="Risk score ≥ 50" icon={MapPinned} tone="amber" />
        <Stat label="Population in pilot network" value={`${Math.round((covered / totalPop) * 100)}%`} sub={`${fmtNum(covered)} of ${fmtNum(totalPop)}`} icon={Users} tone="teal" />
        <Stat label="District licence" value={licence ? fmtMoney(licence.price) : '—'} sub={licence ? `${licence.scope} · ${licence.status}` : ''} icon={Landmark} tone="brand" onClick={() => navigate('/app/subscription')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Risk by district" subtitle="14-day horizon" actions={<Segmented size="sm" value={cond} onChange={setCond} options={[{ value: 'all', label: 'All' }, ...CONDITIONS.map((c) => ({ value: c.id, label: c.label }))]} />} />
          <div className="p-4">
            <RiskMap values={values} height={560} onSelect={(id) => navigate(`/app/map?district=${id}`)} />
            <RiskLegend className="mt-2 justify-center" />
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Districts outside the pilot ({DISTRICTS.length - PILOT_DISTRICTS.length}) are estimated from pharmacy and public feeds only, so confidence is lower.</div>
          </div>
        </Card>
        <div className="space-y-4 xl:col-span-3">
          <Card>
            <CardHeader title="Chronic admissions · all partner hospitals" subtitle={cond === 'all' ? 'All conditions' : CONDITION_MAP[cond].label} />
            <div className="p-5">
              <ForecastChart data={series} height={240} color={cond === 'all' ? '#179c8b' : CONDITION_MAP[cond].color} />
              <div className="mt-2"><ForecastLegend color={cond === 'all' ? '#179c8b' : CONDITION_MAP[cond].color} /></div>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title="By governorate" subtitle="Population-weighted risk score" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50/60"><tr><Th>Governorate</Th>{CONDITIONS.map((c) => <Th key={c.id} className="text-center">{c.label}</Th>)}<Th className="text-right">Pilot districts</Th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {govs.map((g) => (
                    <tr key={g.name}>
                      <td className="px-4 py-2.5"><div className="font-medium text-slate-800">{g.name}</div><div className="text-[11px] text-slate-400">{fmtNum(g.pop)} people</div></td>
                      {CONDITIONS.map((c) => {
                        const v = g.risk[c.id];
                        const b = riskBand(v);
                        return <td key={c.id} className="px-4 py-2.5 text-center"><span className="inline-block min-w-[42px] rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: b.color }}>{v}</span></td>;
                      })}
                      <td className="px-4 py-2.5 text-right text-xs text-slate-600">{g.pilot}/{g.districts.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Active alerts nationwide" subtitle="Including districts outside the pilot network" />
        <div className="grid gap-2.5 p-4 lg:grid-cols-2">{active.map((a) => <AlertRow key={a.id} a={a} />)}</div>
      </Card>
    </div>
  );
}
