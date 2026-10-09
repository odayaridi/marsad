import { useState } from 'react';
import { FileBarChart, Plus, Printer, Share2, CheckCircle2, ShieldCheck, Timer, Target, BedDouble, PackageCheck, PhoneCall, Star, DollarSign, Send } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Button, Badge, Modal, Field, Select, Checkbox, PageSkeleton, ConditionTag } from '../components/ui';
import { SimpleBars } from '../components/charts';
import { useSimulatedLoad } from '../lib/hooks';
import { IMPACT, SEED_ALERTS, MY_HOSPITAL } from '../data/seed';
import { CONDITION_MAP, DISTRICT_MAP } from '../data/reference';
import { fmtDate, fmtMoney, cn } from '../lib/utils';
import logoLockup from '../assets/logo-lockup.png';

function ReportView({ report }) {
  const I = IMPACT;
  const kpis = [
    [Timer, `${I.leadTimeMedian} days`, 'Median warning lead time'],
    [Target, `${Math.round(I.precision * 100)}%`, 'Alerts that materialised'],
    [BedDouble, `≈ ${I.avoidedAdmissions}`, 'Avoidable admissions prevented (est.)'],
    [PackageCheck, I.stockoutsPrevented, 'Stock-outs prevented'],
    [PhoneCall, I.outreachReached, 'High-risk patients reached by PHCs'],
    [Star, `${I.trust}/5`, 'Average director trust score'],
    [CheckCircle2, I.actionsCompleted, 'Actions completed'],
    [DollarSign, fmtMoney(I.savingsUsd), 'Estimated cost avoided'],
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <img src={logoLockup} alt="Marsad" className="mb-3 h-10" />
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">{report.type === 'quarterly' ? 'Quarterly impact report' : 'Monthly review'}</div>
          <h2 className="mt-1 text-xl font-bold text-navy-900">{report.title}</h2>
          <div className="text-sm text-slate-500">{report.period} · Mount Lebanon pilot network · prepared for {report.audience.join(', ')}</div>
        </div>
        <Badge className={report.status === 'published' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}>{report.status === 'published' ? 'Published' : 'Draft'}</Badge>
      </div>
      <div className="rounded-xl bg-gradient-to-r from-brand-50 to-teal-50 p-4 text-[15px] leading-relaxed text-navy-900">
        <b>Summary.</b> Marsad issued <b>{I.alertsIssued} alerts</b> with a median <b>{I.leadTimeMedian}-day</b> head start. {Math.round(I.precision * 100)}% materialised. Partner hospitals reserved beds, secured medicines and asked PHCs to call high-risk patients, preventing an estimated <b>{I.avoidedAdmissions} avoidable admissions</b> and <b>{I.stockoutsPrevented} stock-outs</b>. Directors opened the morning brief on {Math.round(I.briefOpenRate * 100)}% of days.
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(([Ic, v, l]) => (
          <div key={l} className="rounded-xl border border-slate-200 p-4">
            <Ic className="h-5 w-5 text-teal-600" />
            <div className="mt-2 text-2xl font-bold text-navy-900">{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-800">Alerts and avoided admissions by month</div>
          <SimpleBars data={I.monthly} xKey="m" bars={[{ key: 'alerts', label: 'Alerts', color: '#1f6fbe' }, { key: 'accurate', label: 'Materialised', color: '#0e2a52' }, { key: 'avoided', label: 'Avoided admissions', color: '#2fb7a4' }]} height={220} />
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-800">By condition</div>
          <SimpleBars data={I.byCondition.map((c) => ({ name: CONDITION_MAP[c.condition].label, Alerts: c.alerts, Avoided: c.avoided }))} xKey="name" bars={[{ key: 'Alerts', label: 'Alerts', color: '#97e3d6' }, { key: 'Avoided', label: 'Avoided admissions', color: '#0e2a52' }]} height={220} />
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold text-slate-800">Case stories</div>
        <div className="grid gap-3 md:grid-cols-2">
          {SEED_ALERTS.filter((a) => a.outcome).map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2"><ConditionTag id={a.condition} size="sm" /><span className="text-xs text-slate-400">{a.id} · {DISTRICT_MAP[a.district].name}</span></div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Forecast +{a.rise}% · observed +{a.outcome.observedRise}% · {a.outcome.leadDays} days' warning</div>
              <div className="mt-1 text-sm text-slate-600">{a.outcome.note}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Method: avoided admissions are estimated as the gap between the forecast rise and the observed rise in districts where actions were completed, adjusted by the model's back-test error. District-level aggregates only. Figures are illustrative pilot data.
      </div>
    </div>
  );
}

export default function Reports() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const loading = useSimulatedLoad(450);
  const [selId, setSelId] = useState(null);
  const [genOpen, setGenOpen] = useState(false);
  const [gen, setGen] = useState({ type: 'monthly', period: 'Last 30 days', audience: ['Medical directors'] });
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTo, setShareTo] = useState({ Board: true, MoPH: false, Donors: false });
  const [generating, setGenerating] = useState(false);

  if (loading) return <PageSkeleton />;
  const sel = state.reports.find((r) => r.id === selId) || state.reports[0];

  return (
    <div>
      <PageHeader
        eyebrow="Govern"
        title="Impact reports"
        subtitle={`Proof of impact for the board, the Ministry and funders: monthly reviews and quarterly impact reports for ${MY_HOSPITAL.name} and the pilot network.`}
        actions={<Button variant="primary" icon={Plus} onClick={() => setGenOpen(true)}>Generate report</Button>}
      />
      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="h-fit">
          <CardHeader title="Reports" subtitle={`${state.reports.length} total`} icon={FileBarChart} />
          <div className="divide-y divide-slate-100">
            {state.reports.map((r) => (
              <button type="button" key={r.id} onClick={() => setSelId(r.id)} className={cn('block w-full px-5 py-3 text-left hover:bg-slate-50', sel?.id === r.id && 'bg-brand-50/60')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-slate-800">{r.title}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Badge className={r.status === 'published' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}>{r.status}</Badge>
                  {fmtDate(r.created)}
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-3">
          <div className="no-print flex flex-wrap items-center justify-end gap-2 border-b border-slate-100 px-5 py-3">
            {sel.status === 'draft' && <Button variant="teal" icon={CheckCircle2} onClick={() => { dispatch({ type: 'REPORT_UPDATE', id: sel.id, patch: { status: 'published' }, auditAction: 'APPROVE' }); toast('Report published'); }}>Publish</Button>}
            <Button icon={Share2} onClick={() => setShareOpen(true)}>Share</Button>
            <Button icon={Printer} onClick={() => window.print()}>Print / PDF</Button>
          </div>
          <div className="p-6">{generating ? <div className="py-24 text-center text-sm text-slate-500"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />Compiling outcomes, forecasts and actions…</div> : <ReportView report={sel} />}</div>
        </Card>
      </div>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} icon={Plus} title="Generate report" footer={<><Button onClick={() => setGenOpen(false)}>Cancel</Button><Button variant="primary" disabled={!gen.audience.length} onClick={() => {
        const title = gen.type === 'quarterly' ? `Quarterly impact report · ${gen.period}` : `Monthly review · ${gen.period}`;
        dispatch({ type: 'REPORT_ADD', report: { ...gen, title } });
        setGenOpen(false);
        setGenerating(true);
        setTimeout(() => { setGenerating(false); setSelId(null); toast('Report generated', { desc: 'Saved as draft. Review it, then publish.' }); }, 1200);
      }}>Generate</Button></>}>
        <div className="space-y-4">
          <Field label="Type"><Select value={gen.type} onChange={(e) => setGen({ ...gen, type: e.target.value })} options={[{ value: 'monthly', label: 'Monthly review' }, { value: 'quarterly', label: 'Quarterly impact report' }]} /></Field>
          <Field label="Period"><Select value={gen.period} onChange={(e) => setGen({ ...gen, period: e.target.value })} options={['Last 30 days', 'Pilot to date', 'Q4 2026 (to date)', 'Jul – Sep 2026'].map((p) => ({ value: p, label: p }))} /></Field>
          <Field label="Audience">
            <div className="flex flex-wrap gap-4">{['Medical directors', 'Board', 'MoPH', 'Donors', 'Insurers'].map((a) => <Checkbox key={a} label={a} checked={gen.audience.includes(a)} onChange={(v) => setGen({ ...gen, audience: v ? [...gen.audience, a] : gen.audience.filter((x) => x !== a) })} />)}</div>
          </Field>
        </div>
      </Modal>
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} icon={Share2} title="Share report" subtitle={sel.title} size="sm" footer={<><Button onClick={() => setShareOpen(false)}>Cancel</Button><Button variant="primary" icon={Send} disabled={!Object.values(shareTo).some(Boolean)} onClick={() => {
        const list = Object.entries(shareTo).filter(([, v]) => v).map(([k]) => k);
        dispatch({ type: 'REPORT_UPDATE', id: sel.id, patch: { audience: [...new Set([...sel.audience, ...list])] }, auditAction: 'SHARE' });
        toast('Report shared', { desc: list.join(', ') });
        setShareOpen(false);
      }}>Share</Button></>}>
        <div className="space-y-3">{Object.keys(shareTo).map((k) => <Checkbox key={k} label={k === 'MoPH' ? 'Ministry of Public Health' : k === 'Board' ? 'Hospital CEO & board' : 'Donors & insurers'} checked={shareTo[k]} onChange={(v) => setShareTo({ ...shareTo, [k]: v })} />)}</div>
      </Modal>
    </div>
  );
}
