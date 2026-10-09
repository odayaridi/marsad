import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, Search, ShieldCheck, Eye, FileText, Download, PhoneOff, UserCheck, Ban, Send, FilterX } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Button, Input, Select, StatusBadge, ConditionTag, Progress, Drawer, Field, Textarea, EmptyState, PageSkeleton, Pagination, Badge, Th } from '../components/ui';
import { useSimulatedLoad, usePaged } from '../lib/hooks';
import { OUTREACH_STATUS } from '../data/seed';
import { DISTRICT_MAP, CONDITION_MAP } from '../data/reference';
import { fmtRelative, toCSV, downloadText, cn } from '../lib/utils';

const SCRIPTS = {
  diabetes: ['Introduce yourself and the PHC; confirm you are speaking with the patient or carer.', 'Ask whether they have enough insulin / tablets for the next 2 weeks.', 'Advise hydration and staying cool during the heatwave; check glucose twice daily.', 'Offer a same-week PHC visit if readings > 300 mg/dL or symptoms.', 'Record the outcome below.'],
  cardiac: ['Introduce yourself and the PHC.', 'Check diuretic and blood-pressure medicines are available.', 'Ask about breathlessness, swelling or weight gain > 2 kg in 3 days.', 'Advise avoiding heat in the afternoon; keep fluids as prescribed.', 'Refer same-week if symptoms worsen.'],
  respiratory: ['Introduce yourself and the PHC.', 'Check reliever inhaler supply; mention nebuliser alternative if out of stock.', 'Advise staying indoors on dust days and away from generator exhaust.', 'For home-oxygen users: confirm a backup plan for power cuts.', 'Refer if using reliever more than 4 times/day.'],
};

export default function Outreach() {
  const { state, dispatch, role } = useStore();
  const toast = useToast();
  const loading = useSimulatedLoad(450);
  const [q, setQ] = useState('');
  const [list, setList] = useState('all');
  const [phc, setPhc] = useState(role === 'phc' ? 'p-hadath' : 'all');
  const [status, setStatus] = useState('all');
  const [log, setLog] = useState(null);
  const [revealed, setRevealed] = useState({});

  const lists = useMemo(() => {
    const ids = [...new Set(state.outreach.map((o) => o.alertId))];
    return ids.map((id) => {
      const items = state.outreach.filter((o) => o.alertId === id);
      const a = state.alerts.find((x) => x.id === id);
      return { id, alert: a, total: items.length, done: items.filter((o) => o.status !== 'pending').length, reached: items.filter((o) => ['reached', 'referred'].includes(o.status)).length };
    });
  }, [state.outreach, state.alerts]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return state.outreach.filter((o) => (list === 'all' || o.alertId === list) && (phc === 'all' || o.phcId === phc) && (status === 'all' || o.status === status) && (!t || `${o.pid} ${o.reason}`.toLowerCase().includes(t)));
  }, [state.outreach, q, list, phc, status]);
  const paged = usePaged(rows, 12, q + list + phc + status);

  if (loading) return <PageSkeleton />;

  const phcs = [...new Map(state.outreach.map((o) => [o.phcId, o.phc])).entries()];
  const anyFilter = q || list !== 'all' || (phc !== 'all' && role !== 'phc') || status !== 'all';

  const submitLog = () => {
    dispatch({ type: 'OUTREACH_UPDATE', id: log.id, patch: { status: log.status, notes: log.notes } });
    toast('Call logged', { desc: `${log.pid} · ${OUTREACH_STATUS[log.status].label}` });
    setLog(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Act"
        title="PHC outreach"
        subtitle="Call high-risk patients before they deteriorate. Lists are generated from alerts and contain pseudonymous IDs only."
        actions={
          <Button icon={Download} onClick={() => {
            downloadText('marsad-outreach.csv', toCSV(rows, [{ label: 'Pseudonymous ID', value: 'pid' }, { label: 'PHC', value: 'phc' }, { label: 'Condition', value: 'condition' }, { label: 'Age band', value: 'ageBand' }, { label: 'Risk', value: 'risk' }, { label: 'Reason', value: 'reason' }, { label: 'Status', value: 'status' }, { label: 'Attempts', value: 'attempts' }]), 'text/csv');
            dispatch({ type: 'AUDIT', action: 'EXPORT', object: 'Outreach list', detail: `${rows.length} pseudonymous rows` });
            toast('Call list exported', { desc: 'Pseudonymous IDs only.' });
          }}>Export list</Button>
        }
      />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-[13px] text-teal-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <div>Marsad never stores names. Each <b>MRS-ID</b> is re-identified only inside your PHC's own records system. Revealing a phone number is logged in the audit trail.</div>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {lists.map((l) => (
          <Card key={l.id} className={cn('cursor-pointer p-4 transition hover:shadow-md', list === l.id && 'ring-2 ring-teal-300')} onClick={() => setList(list === l.id ? 'all' : l.id)}>
            <div className="flex items-center justify-between">
              <ConditionTag id={l.alert?.condition} size="sm" />
              <Link to={`/app/alerts/${l.id}`} onClick={(e) => e.stopPropagation()} className="text-xs font-medium text-brand-600 hover:underline">{l.id}</Link>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{DISTRICT_MAP[l.alert?.district]?.name} · {CONDITION_MAP[l.alert?.condition]?.label} call list</div>
            <div className="mt-3 flex items-baseline justify-between text-xs text-slate-500"><span><b className="text-lg text-navy-900">{l.done}</b>/{l.total} called</span><span>{l.reached} reached</span></div>
            <Progress value={l.done} max={l.total} className="mt-1.5" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="xl:col-span-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
            <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search MRS-ID or reason…" className="w-full sm:w-56" />
            <Select value={phc} onChange={(e) => setPhc(e.target.value)} className="w-44" options={[{ value: 'all', label: 'All PHCs' }, ...phcs.map(([id, n]) => ({ value: id, label: n }))]} />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36" options={[{ value: 'all', label: 'All outcomes' }, ...Object.entries(OUTREACH_STATUS).map(([k, v]) => ({ value: k, label: v.label }))]} />
            {anyFilter && <Button size="sm" variant="ghost" icon={FilterX} onClick={() => { setQ(''); setList('all'); setStatus('all'); if (role !== 'phc') setPhc('all'); }}>Clear</Button>}
            {role === 'phc' && <Badge className="ml-auto bg-brand-50 text-brand-700 ring-brand-200">Scoped to your PHC</Badge>}
          </div>
          {rows.length === 0 ? (
            <EmptyState icon={PhoneOff} title="No patients in this view" desc="Try another PHC or outcome filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-slate-50/60"><tr><Th>Patient</Th><Th>Risk</Th><Th>Why flagged</Th><Th>PHC</Th><Th>Phone</Th><Th>Outcome</Th><Th /></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.slice.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-mono text-[13px] font-semibold text-navy-900">{o.pid}</div>
                        <div className="text-xs text-slate-500">{o.sex} · {o.ageBand} · <ConditionTag id={o.condition} size="sm" /></div>
                      </td>
                      <td className="px-4 py-3"><span className={cn('rounded-md px-2 py-0.5 text-xs font-bold', o.risk >= 85 ? 'bg-rose-50 text-rose-700' : o.risk >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>{o.risk}</span></td>
                      <td className="max-w-[220px] px-4 py-3 text-xs text-slate-600">{o.reason}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{o.phc}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {revealed[o.id] ? (
                          <span className="font-mono text-slate-800">{o.phone.replace('•••', String(100 + (o.risk * 7) % 900))}</span>
                        ) : (
                          <button type="button" className="inline-flex items-center gap-1 font-mono text-slate-500 hover:text-brand-600" onClick={() => { setRevealed((r) => ({ ...r, [o.id]: true })); dispatch({ type: 'AUDIT', action: 'VIEW', object: `Outreach ${o.pid}`, detail: 'Phone number revealed' }); }}>
                            {o.phone} <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge map={OUTREACH_STATUS} value={o.status} />
                        {o.lastAttempt && <div className="mt-1 text-[11px] text-slate-400">{o.attempts} attempt{o.attempts > 1 ? 's' : ''} · {fmtRelative(o.lastAttempt)}</div>}
                      </td>
                      <td className="px-4 py-3 text-right"><Button size="xs" variant={o.status === 'pending' ? 'primary' : 'secondary'} icon={PhoneCall} onClick={() => setLog({ ...o, status: o.status === 'pending' ? 'reached' : o.status })}>Log call</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination {...paged} />
        </Card>

        <Card>
          <CardHeader title="Call script" subtitle="Suggested by condition" icon={FileText} />
          <div className="space-y-4 p-5">
            {Object.entries(SCRIPTS).map(([c, steps]) => (
              <details key={c} className="group rounded-lg border border-slate-200 p-3" open={c === 'diabetes'}>
                <summary className="cursor-pointer list-none"><ConditionTag id={c} size="sm" /></summary>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-600">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
              </details>
            ))}
          </div>
        </Card>
      </div>

      <Drawer
        open={!!log}
        onClose={() => setLog(null)}
        title={`Log call · ${log?.pid || ''}`}
        subtitle={log ? `${log.phc} · ${CONDITION_MAP[log.condition].label} · age ${log.ageBand}` : ''}
        footer={<><Button onClick={() => setLog(null)}>Cancel</Button><Button variant="primary" icon={Send} onClick={submitLog}>Save outcome</Button></>}
      >
        {log && (
          <div className="space-y-5">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><b>Flagged because:</b> {log.reason}</div>
            <Field label="Outcome">
              <div className="grid grid-cols-2 gap-2">
                {[['reached', 'Reached', UserCheck], ['no_answer', 'No answer', PhoneOff], ['referred', 'Referred to PHC visit', Send], ['declined', 'Declined', Ban]].map(([k, l, I]) => (
                  <button type="button" key={k} onClick={() => setLog((x) => ({ ...x, status: k }))} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium', log.status === k ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
                    <I className="h-4 w-4" /> {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Notes" hint="No names or identifying details. Use clinical shorthand.">
              <Textarea value={log.notes} onChange={(e) => setLog((x) => ({ ...x, notes: e.target.value }))} placeholder="e.g. Refill arranged at Hadath PHC; advised hydration." />
            </Field>
            <div>
              <div className="mb-2 text-[13px] font-medium text-slate-700">Script</div>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-600">{SCRIPTS[log.condition].map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
