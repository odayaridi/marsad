import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FlaskConical, Pill, Stethoscope, CloudSun, Thermometer, Zap, Wind, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, PageHeader, Select, Tabs, PageSkeleton, ConditionTag, Badge, Th } from '../components/ui';
import { TrendChart, StressorChart, Sparkline } from '../components/charts';
import { useSimulatedLoad } from '../lib/hooks';
import { labSignals, stressorForecast, SHORTAGES } from '../data/seed';
import { DISTRICTS, DISTRICT_MAP } from '../data/reference';
import { fmtShort, fmtRelative, cn } from '../lib/utils';

const DEFS = [
  { key: 'hba1c', label: 'HbA1c ≥ 9% (share of tests)', unit: '%', group: 'lab', condition: 'diabetes', color: '#1f6fbe' },
  { key: 'bnp', label: 'NT-proBNP > 900 pg/mL (share, 65+)', unit: '%', group: 'lab', condition: 'cardiac', color: '#d6455d' },
  { key: 'eos', label: 'Eosinophilia in COPD/asthma panels', unit: '%', group: 'lab', condition: 'respiratory', color: '#179c8b' },
  { key: 'insulin', label: 'Insulin refills overdue > 7 days', unit: '%', group: 'refill', condition: 'diabetes', color: '#1f6fbe' },
  { key: 'diuretic', label: 'Diuretic / antihypertensive refills overdue', unit: '%', group: 'refill', condition: 'cardiac', color: '#d6455d' },
  { key: 'inhaler', label: 'Inhaler refills overdue', unit: '%', group: 'refill', condition: 'respiratory', color: '#179c8b' },
  { key: 'missed', label: 'Missed chronic-care PHC visits', unit: '%', group: 'phc', condition: null, color: '#7c3aed' },
];

export default function Signals() {
  const loading = useSimulatedLoad(450);
  const [params, setParams] = useSearchParams();
  const district = params.get('district') || 'baabda';
  const [tab, setTab] = useState('lab');
  const data = useMemo(() => labSignals(district), [district]);
  const stress = useMemo(() => stressorForecast(), []);

  const anomalies = useMemo(() => {
    return DEFS.map((d) => {
      const vals = data.map((x) => x[d.key]);
      const base = vals.slice(0, 8);
      const mean = base.reduce((a, b) => a + b, 0) / base.length;
      const sd = Math.sqrt(base.reduce((a, b) => a + (b - mean) ** 2, 0) / base.length) || 1;
      const last = vals[vals.length - 1];
      const z = (last - mean) / sd;
      return { ...d, mean, last, z, change: ((last - mean) / mean) * 100, vals };
    }).sort((a, b) => b.z - a.z);
  }, [data]);

  if (loading) return <PageSkeleton />;

  const flagged = anomalies.filter((a) => a.z >= 2);

  return (
    <div>
      <PageHeader
        eyebrow="Detect"
        title="Early signals"
        subtitle="Unusual rises in lab values, missed refills and follow-ups, and the external stressors that amplify them."
        actions={<Select value={district} onChange={(e) => setParams({ district: e.target.value })} className="w-48" options={DISTRICTS.filter((d) => d.pilot).map((d) => ({ value: d.id, label: d.name }))} />}
      />

      <Card className="mb-4">
        <CardHeader title={`Unusual changes · ${DISTRICT_MAP[district].name}`} subtitle="Latest week vs. 8-week baseline. Flagged when ≥ 2 standard deviations above normal." icon={AlertTriangle} />
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {anomalies.slice(0, 4).map((a) => (
            <div key={a.key} className={cn('rounded-xl border p-4', a.z >= 2 ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200')}>
              <div className="flex items-center justify-between gap-2">
                {a.condition ? <ConditionTag id={a.condition} size="sm" /> : <Badge className="bg-violet-50 text-violet-700 ring-violet-200">All chronic</Badge>}
                {a.z >= 2 ? <Badge className="bg-rose-50 text-rose-700 ring-rose-200">Unusual · z {a.z.toFixed(1)}</Badge> : <Badge>Normal</Badge>}
              </div>
              <div className="mt-2 text-[13px] font-medium text-slate-800">{a.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-navy-900">{a.last}{a.unit}</span>
                <span className={cn('flex items-center gap-0.5 text-xs font-semibold', a.change > 0 ? 'text-rose-600' : 'text-teal-600')}>
                  {a.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{a.change > 0 ? '+' : ''}{a.change.toFixed(0)}%
                </span>
              </div>
              <Sparkline data={a.vals} color={a.color} height={34} />
            </div>
          ))}
        </div>
        {flagged.length === 0 && <div className="px-5 pb-4 text-sm text-slate-500">No unusual changes this week in {DISTRICT_MAP[district].name}.</div>}
      </Card>

      <Card>
        <Tabs
          className="px-3"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'lab', label: 'Lab results' },
            { id: 'refill', label: 'Pharmacy refills' },
            { id: 'phc', label: 'PHC follow-up' },
            { id: 'stress', label: 'Stressors & shortages' },
          ]}
        />
        <div className="p-5">
          {tab === 'lab' && (
            <>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-600"><FlaskConical className="h-4 w-4 text-violet-600" /> From Levant Diagnostics, Cedar Clinical Labs and MedLab Mount Lebanon · weekly, de-identified</div>
              <TrendChart data={data} height={300} yUnit="%" lines={DEFS.filter((d) => d.group === 'lab').map((d) => ({ key: d.key, label: d.label, color: d.color }))} />
            </>
          )}
          {tab === 'refill' && (
            <>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-600"><Pill className="h-4 w-4 text-amber-600" /> From the Mount Lebanon pharmacy refill network (42 pharmacies) and PHC dispensaries</div>
              <TrendChart data={data} height={300} yUnit="%" lines={DEFS.filter((d) => d.group === 'refill').map((d) => ({ key: d.key, label: d.label, color: d.color }))} />
            </>
          )}
          {tab === 'phc' && (
            <>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-600"><Stethoscope className="h-4 w-4 text-teal-600" /> Missed chronic-care visits at partner PHCs. Patients skip care and nobody flags it, until now.</div>
              <TrendChart data={data} height={300} yUnit="%" lines={[{ key: 'missed', label: 'Missed chronic-care visits', color: '#7c3aed' }]} />
              <div className="mt-3 text-sm text-slate-600">Flagged patients are turned into de-identified call lists in <Link to="/app/outreach" className="font-medium text-brand-600 hover:underline">PHC Outreach</Link>.</div>
            </>
          )}
          {tab === 'stress' && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Thermometer className="h-4 w-4 text-rose-500" /> Heat index (°C)</div>
                  <div className="text-xs text-slate-500">Threshold 38 °C · next 14 days</div>
                  <StressorChart data={stress} dataKey="heat" color="#e11d48" threshold={38} unit="°C" height={150} />
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Zap className="h-4 w-4 text-amber-500" /> Grid supply (hours/day)</div>
                  <div className="text-xs text-slate-500">Below 8 h affects home oxygen &amp; insulin storage</div>
                  <StressorChart data={stress} dataKey="power" color="#d97706" threshold={8} unit="h" height={150} invert />
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Wind className="h-4 w-4 text-sky-600" /> PM10 (µg/m³)</div>
                  <div className="text-xs text-slate-500">Threshold 120 µg/m³ · dust &amp; generator smoke</div>
                  <StressorChart data={stress} dataKey="pm10" color="#0284c7" threshold={120} unit="µg/m³" height={150} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><CloudSun className="h-4 w-4 text-cyan-600" /> Medicine shortages (MoPH list + pharmacy stock feed)</div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-slate-50"><tr><Th>Item</Th><Th>Condition</Th><Th>Pharmacies out</Th><Th>Districts</Th><Th>Since</Th><Th>Severity</Th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {SHORTAGES.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{s.item}</td>
                          <td className="px-4 py-2.5"><ConditionTag id={s.condition} size="sm" /></td>
                          <td className="px-4 py-2.5 tabular">{s.share}%</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{s.districts.map((d) => DISTRICT_MAP[d].name).join(', ')}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{fmtShort(s.since)} ({fmtRelative(s.since)})</td>
                          <td className="px-4 py-2.5"><Badge className={s.severity === 'high' ? 'bg-rose-50 text-rose-700 ring-rose-200' : s.severity === 'medium' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}>{s.severity}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
