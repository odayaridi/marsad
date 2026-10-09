import { useState } from 'react';
import { CreditCard, CheckCircle2, Gift, Receipt, Landmark, TrendingUp, Lock, Building2, Sparkles } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Button, Badge, Modal, Select, Progress, PageSkeleton, EmptyState, Stat, Th } from '../components/ui';
import { useSimulatedLoad } from '../lib/hooks';
import { PILOT, MY_HOSPITAL } from '../data/seed';
import { PRICING_TIERS, DISTRICT_LICENCE_PRICE, DISTRICT_MAP } from '../data/reference';
import { fmtMoney, fmtDate, addDays, TODAY, cn } from '../lib/utils';

const LIC_STAGES = ['prospect', 'proposal', 'negotiation', 'signed'];
const tierFor = (beds) => (beds < 100 ? PRICING_TIERS[0] : beds <= 250 ? PRICING_TIERS[1] : PRICING_TIERS[2]);

export default function Subscription() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const loading = useSimulatedLoad(400);
  const [convert, setConvert] = useState(false);
  const [billing, setBilling] = useState('annual');
  const [converted, setConverted] = useState(false);
  if (loading) return <PageSkeleton />;

  const tier = tierFor(MY_HOSPITAL.beds);
  const day = Math.round((TODAY - new Date(PILOT.startedAt)) / 86400000);
  const ends = addDays(new Date(PILOT.startedAt), PILOT.lengthDays);
  const hospitals = state.partners.filter((p) => p.type === 'hospital');
  const hospRevenue = hospitals.reduce((s, h) => s + tierFor(h.beds).price, 0);
  const signedLic = state.licences.filter((l) => l.status === 'signed').reduce((s, l) => s + l.price, 0);

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Subscription & licences" subtitle="Hospitals pay by size; labs and clinics join free. Ministry, insurers and donors buy district licences. We never sell data." />

      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="bg-gradient-to-r from-navy-900 to-brand-700 p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-300">Current plan</div>
                <div className="mt-1 text-2xl font-bold">{MY_HOSPITAL.name}</div>
                <div className="text-sm text-navy-100/80">{MY_HOSPITAL.beds} beds · {tier.label} tier · {fmtMoney(tier.price)} / year after pilot</div>
              </div>
              <Badge className={converted ? 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/40' : 'bg-teal-400/20 text-teal-100 ring-teal-300/40'}>{converted ? <><CheckCircle2 className="h-3.5 w-3.5" /> Annual subscription</> : <><Gift className="h-3.5 w-3.5" /> Free pilot</>}</Badge>
            </div>
            {!converted && (
              <div className="mt-6">
                <div className="flex justify-between text-sm"><span>Pilot day {day} of {PILOT.lengthDays}</span><span>Ends {fmtDate(ends)}</span></div>
                <div className="mt-2 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-teal-400" style={{ width: `${(day / PILOT.lengthDays) * 100}%` }} /></div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="text-sm text-slate-600">{converted ? 'Your subscription is active. The first invoice is issued when the pilot ends.' : 'Includes daily brief, explainable alerts, action plans, readiness, monthly review and quarterly impact report.'}</div>
            {!converted && <Button variant="primary" icon={CreditCard} onClick={() => setConvert(true)}>Continue after pilot</Button>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Unit economics" subtitle="Per hospital, per year (assumptions)" icon={TrendingUp} />
          <div className="space-y-3 p-5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Average subscription</span><b>{fmtMoney(8000)}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">Hosting, integration &amp; support</span><b className="text-rose-600">− {fmtMoney(2000)}</b></div>
            <div className="flex justify-between border-t border-slate-100 pt-3"><span className="font-semibold text-slate-800">Contribution</span><b className="text-teal-700">{fmtMoney(6000)} (75%)</b></div>
            <Progress value={75} className="mt-1" />
            <div className="text-xs text-slate-500">Largest fixed cost: team salaries, plus security &amp; compliance audits.</div>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Pricing by hospital size · first 3 months free</h2>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {PRICING_TIERS.map((t) => (
          <Card key={t.id} className={cn('p-5', t.id === tier.id && 'ring-2 ring-teal-400')}>
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-600">{t.label}</span>{t.id === tier.id && <Badge className="bg-teal-50 text-teal-700 ring-teal-200">Your tier</Badge>}</div>
            <div className="mt-2 text-2xl font-bold text-navy-900">{fmtMoney(t.price)}<span className="text-sm font-medium text-slate-400"> / yr</span></div>
            <div className="mt-1 text-xs text-slate-500">{fmtMoney(Math.round(t.price / 12))} per month equivalent</div>
          </Card>
        ))}
        <Card className="border-teal-200 bg-teal-50/50 p-5">
          <div className="text-sm font-semibold text-teal-700">District licence</div>
          <div className="mt-2 text-2xl font-bold text-navy-900">≈ {fmtMoney(DISTRICT_LICENCE_PRICE)}<span className="text-sm font-medium text-slate-400"> / yr</span></div>
          <div className="mt-1 text-xs text-slate-600">MoPH, insurers, donors</div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title="District licences" subtitle="Ministry, NSSF & insurers, donors" icon={Landmark} />
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60"><tr><Th>Buyer</Th><Th>Scope</Th><Th className="text-right">Value</Th><Th>Stage</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {state.licences.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3"><div className="font-medium text-slate-800">{l.buyer}</div><div className="text-xs text-slate-500">{l.note}</div></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{l.scope}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtMoney(l.price)}</td>
                  <td className="px-4 py-3">
                    <select value={l.status} onChange={(e) => { dispatch({ type: 'LICENCE_UPDATE', id: l.id, patch: { status: e.target.value } }); toast('Licence stage updated', { desc: `${l.buyer} → ${e.target.value}` }); }} className={cn('rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium capitalize ring-1 ring-inset', l.status === 'signed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : l.status === 'negotiation' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-slate-600 ring-slate-200')}>
                      {LIC_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Pilot network hospitals" subtitle={`Potential annual revenue after pilot: ${fmtMoney(hospRevenue + signedLic)}`} icon={Building2} />
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60"><tr><Th>Hospital</Th><Th>Beds</Th><Th>Tier</Th><Th className="text-right">Annual</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2.5"><div className="font-medium text-slate-800">{h.name}</div><div className="text-xs text-slate-500">{DISTRICT_MAP[h.district].name} · {h.sector}</div></td>
                  <td className="px-4 py-2.5 tabular">{h.beds}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{tierFor(h.beds).label}</td>
                  <td className="px-4 py-2.5 text-right tabular">{fmtMoney(tierFor(h.beds).price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Market size (Lebanon)" subtitle="From the business model; all figures are assumptions to test except hospital count (MoPH)" icon={Sparkles} />
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {[['TAM', '≈ $1.7M / yr', 'All 186 hospitals (29 public + 157 private) × $8,000 + 5 national buyers × $40,000', 'bg-navy-900 text-white'], ['SAM', '≈ $720K / yr', '~80 digitised hospitals in Beirut & Mount Lebanon + 2 licences', 'bg-brand-600 text-white'], ['SOM · year 1', '≈ $88K', '6 hospitals × $8,000 + 1 donor licence', 'bg-teal-500 text-white']].map(([k, v, d, cls]) => (
              <div key={k} className={cn('rounded-xl p-4', cls)}>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{k}</div>
                <div className="mt-1 text-2xl font-bold">{v}</div>
                <div className="mt-2 text-xs opacity-80">{d}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Invoices" icon={Receipt} />
          <EmptyState icon={Receipt} title="No invoices during the pilot" desc={`Your first invoice will be issued on ${fmtDate(ends)} if you continue.`} className="py-10" />
        </Card>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" /> Revenue never comes from selling data. Labs, PHCs and NGOs always join free.</div>

      <Modal open={convert} onClose={() => setConvert(false)} icon={CreditCard} title="Continue with Marsad after the pilot" subtitle={`${MY_HOSPITAL.name} · ${tier.label}`} footer={<><Button onClick={() => setConvert(false)}>Not now</Button><Button variant="primary" onClick={() => { setConverted(true); setConvert(false); dispatch({ type: 'AUDIT', action: 'APPROVE', object: 'Subscription', detail: `${tier.label} · ${billing}` }); toast('Subscription confirmed', { desc: `Billing starts ${fmtDate(ends)}.` }); }}>Confirm subscription</Button></>}>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex justify-between"><span>Annual subscription</span><b>{fmtMoney(tier.price)}</b></div>
            <div className="mt-1 flex justify-between text-slate-500"><span>Billing starts</span><span>{fmtDate(ends)}</span></div>
          </div>
          <Select value={billing} onChange={(e) => setBilling(e.target.value)} options={[{ value: 'annual', label: 'Pay annually' }, { value: 'quarterly', label: 'Pay quarterly (4 × ' + fmtMoney(tier.price / 4) + ')' }]} />
          <p className="text-xs text-slate-500">This prototype does not process payments. In production, invoices go to the hospital finance department.</p>
        </div>
      </Modal>
    </div>
  );
}
