import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Timer, CheckCircle2, PieChart, BellRing, Download, Gift, Stethoscope } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Button, Stat, Select, PageSkeleton, ConditionTag, Th } from '../components/ui';
import { SimpleBars } from '../components/charts';
import { useSimulatedLoad } from '../lib/hooks';
import { BENCHMARKS } from '../data/seed';
import { DISTRICT_MAP } from '../data/reference';
import { fmtNum, downloadText, cn } from '../lib/utils';

const PHC_BENCH = [
  { name: 'Hadath PHC', missed: 18.2, outreach: 74, refills: 88 },
  { name: 'Chiyah PHC', missed: 21.5, outreach: 61, refills: 84 },
  { name: 'Jdeideh PHC', missed: 16.9, outreach: 69, refills: 90 },
  { name: 'Choueifat PHC', missed: 24.8, outreach: 52, refills: 79 },
  { name: 'Damour PHC', missed: 27.1, outreach: 48, refills: 76 },
];

export default function Benchmarks() {
  const { state, dispatch, role } = useStore();
  const toast = useToast();
  const loading = useSimulatedLoad(450);
  const [view, setView] = useState(role === 'phc' ? 'phc' : 'lab');
  if (loading) return <PageSkeleton />;
  const b = BENCHMARKS;
  const informed = state.alerts.filter((a) => a.signals.some((s) => s.type === 'lab'));

  return (
    <div>
      <PageHeader
        eyebrow="Connect"
        title="Benchmarks"
        subtitle="What labs and PHCs get back, free, for sharing data: how you compare with the network and where your data made a difference."
        actions={
          <>
            <Select value={view} onChange={(e) => setView(e.target.value)} className="w-56" options={[{ value: 'lab', label: 'Levant Diagnostics Network (lab)' }, { value: 'phc', label: 'PHC network comparison' }]} />
            <Button icon={Download} onClick={() => {
              downloadText('marsad-benchmark-report.txt', `Marsad benchmark report\n\nTurnaround: ${b.turnaroundHours} h (network ${b.networkTurnaround} h)\nCompleteness: ${b.completeness}% (network ${b.networkCompleteness}%)\nShare of network lab data: ${Math.round(b.contributionShare * 100)}%\nAlerts informed: ${b.alertsInformed}\n`);
              dispatch({ type: 'AUDIT', action: 'EXPORT', object: 'Benchmark report', detail: view });
              toast('Benchmark report downloaded');
            }}>Download report</Button>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-sm text-teal-900">
        <Gift className="h-5 w-5 shrink-0" /> Labs, PHCs and NGOs join Marsad free. In return for anonymised data they receive these benchmarks every month.
      </div>

      {view === 'lab' ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Result turnaround" value={`${b.turnaroundHours} h`} sub={`Network median ${b.networkTurnaround} h`} icon={Timer} tone="teal" />
            <Stat label="Data completeness" value={`${b.completeness}%`} sub={`Network median ${b.networkCompleteness}%`} icon={CheckCircle2} tone="brand" />
            <Stat label="Share of network lab data" value={`${Math.round(b.contributionShare * 100)}%`} sub="Largest contributor" icon={PieChart} tone="violet" />
            <Stat label="Alerts your data informed" value={b.alertsInformed} sub="Since joining the pilot" icon={BellRing} tone="amber" />
          </div>
          <div className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader title="HbA1c ≥ 9%: your patients vs. the network" subtitle="Share of tests by district, last 4 weeks" />
              <div className="p-5">
                <SimpleBars data={b.districts.map((d) => ({ name: DISTRICT_MAP[d.district].name, You: d.yourHba1c, Network: d.networkHba1c }))} xKey="name" bars={[{ key: 'You', label: 'Your lab %', color: '#7c3aed' }, { key: 'Network', label: 'Network %', color: '#cbd5e1' }]} height={280} />
              </div>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader title="Tests contributed by district" />
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60"><tr><Th>District</Th><Th className="text-right">Tests</Th><Th className="text-right">vs network</Th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {b.districts.map((d) => {
                    const diff = d.yourHba1c - d.networkHba1c;
                    return (
                      <tr key={d.district}>
                        <td className="px-4 py-2.5 text-slate-700">{DISTRICT_MAP[d.district].name}</td>
                        <td className="px-4 py-2.5 text-right tabular">{fmtNum(d.tests)}</td>
                        <td className={cn('px-4 py-2.5 text-right font-medium tabular', diff > 1 ? 'text-rose-600' : diff < -1 ? 'text-teal-600' : 'text-slate-500')}>{diff > 0 ? '+' : ''}{diff.toFixed(1)} pts</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader title="Where your data made a difference" subtitle="Alerts in which lab signals contributed" />
            <div className="divide-y divide-slate-100">
              {informed.slice(0, 6).map((a) => {
                const s = a.signals.find((x) => x.type === 'lab');
                return (
                  <Link key={a.id} to={`/app/alerts/${a.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <ConditionTag id={a.condition} size="sm" />
                    <span className="flex-1 text-sm text-slate-800">{a.title}</span>
                    <span className="text-xs text-slate-500">{s.label} · <b className="text-violet-700">{s.weight}% of the signal</b></span>
                  </Link>
                );
              })}
            </div>
          </Card>
        </>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title="Missed chronic-care visits" subtitle="Share of booked visits missed, last 30 days (lower is better)" icon={Stethoscope} />
            <div className="p-5"><SimpleBars data={PHC_BENCH.map((p) => ({ name: p.name.replace(' PHC', ''), Missed: p.missed }))} xKey="name" bars={[{ key: 'Missed', label: 'Missed %', color: '#7c3aed' }]} height={260} /></div>
          </Card>
          <Card>
            <CardHeader title="Outreach completion & refill adherence" subtitle="Share of flagged patients reached; share of refills on time" />
            <div className="p-5"><SimpleBars data={PHC_BENCH.map((p) => ({ name: p.name.replace(' PHC', ''), Outreach: p.outreach, Refills: p.refills }))} xKey="name" bars={[{ key: 'Outreach', label: 'Outreach reached %', color: '#179c8b' }, { key: 'Refills', label: 'Refills on time %', color: '#1f6fbe' }]} height={260} /></div>
          </Card>
        </div>
      )}
    </div>
  );
}
