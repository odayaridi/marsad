import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCheck, ClipboardList, XCircle, Share2, Printer, Lightbulb, FlaskConical, Pill, CloudSun, Stethoscope, History, Star,
  ShieldCheck, Cpu, Users2, MessageSquarePlus, CheckCircle2, SearchX, Send, ListChecks, Target, ThumbsUp, ThumbsDown, Sparkles,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, Button, ConditionTag, SeverityBadge, StatusBadge, Badge, EmptyState, PageSkeleton, Textarea, Modal, Checkbox, Avatar, DefinitionList, Field } from '../components/ui';
import { ForecastChart, ForecastLegend, Sparkline } from '../components/charts';
import { ActionPlanModal, DismissModal, CategoryIcon } from '../components/alerts';
import { useSimulatedLoad } from '../lib/hooks';
import { getSeries } from '../data/seed';
import { ALERT_STATUS, ACTION_STATUS, CONDITION_MAP, DISTRICT_MAP, AGE_GROUPS } from '../data/reference';
import { fmtShort, fmtDateTime, fmtRelative, fmtNum, cn, TODAY } from '../lib/utils';

const lc = (t = '') => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);

const SIGNAL_TYPE = {
  lab: { label: 'Lab signal', I: FlaskConical, cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  refill: { label: 'Pharmacy signal', I: Pill, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  stressor: { label: 'External stressor', I: CloudSun, cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  phc: { label: 'PHC signal', I: Stethoscope, cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  baseline: { label: 'Seasonality', I: History, cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

function FeedbackPanel({ alert }) {
  const { dispatch, actor } = useStore();
  const toast = useToast();
  const mine = alert.feedback.find((f) => f.by === actor.name);
  const [understood, setUnderstood] = useState(null);
  const [trust, setTrust] = useState(0);
  const [action, setAction] = useState('');
  const [wouldAct, setWouldAct] = useState(null);
  const avg = alert.feedback.length ? alert.feedback.reduce((s, f) => s + f.trust, 0) / alert.feedback.length : null;

  const submit = () => {
    dispatch({ type: 'ALERT_FEEDBACK', id: alert.id, feedback: { understood, trust, action: wouldAct, actionText: action } });
    toast('Thank you, feedback recorded', { desc: 'It counts toward the pilot trust metrics.' });
  };

  return (
    <Card>
      <CardHeader title="Was this alert useful?" subtitle="Your answers measure whether directors trust Marsad" icon={Star} />
      <div className="space-y-4 p-5">
        {mine ? (
          <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800">
            <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> You rated this alert {mine.trust}/5</div>
            <div className="mt-1 text-xs">Understood why it fired: {mine.understood ? 'yes' : 'no'} · Would act: {mine.action ? 'yes' : 'no'}{mine.actionText ? ` (“${mine.actionText}”)` : ''}</div>
          </div>
        ) : (
          <>
            <div>
              <div className="mb-2 text-[13px] font-medium text-slate-700">Do you understand why it fired?</div>
              <div className="flex gap-2">
                {[[true, 'Yes', ThumbsUp], [false, 'Not really', ThumbsDown]].map(([v, l, I]) => (
                  <button type="button" key={l} onClick={() => setUnderstood(v)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium', understood === v ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
                    <I className="h-4 w-4" /> {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[13px] font-medium text-slate-700">How much do you trust it?</div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setTrust(n)} aria-label={`${n} stars`} className="p-0.5">
                    <Star className={cn('h-7 w-7 transition', n <= trust ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300')} />
                  </button>
                ))}
                <span className="ml-2 text-xs text-slate-500">{trust ? ['', 'Not at all', 'Slightly', 'Somewhat', 'Mostly', 'Fully'][trust] : ''}</span>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[13px] font-medium text-slate-700">Will you change something this week because of it?</div>
              <div className="flex gap-2">
                {[[true, 'Yes'], [false, 'No']].map(([v, l]) => (
                  <button type="button" key={l} onClick={() => setWouldAct(v)} className={cn('flex-1 rounded-lg border px-3 py-2 text-sm font-medium', wouldAct === v ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{l}</button>
                ))}
              </div>
              {wouldAct && <Textarea className="mt-2 min-h-[60px]" value={action} onChange={(e) => setAction(e.target.value)} placeholder="Name the action, e.g. reserve 4 beds" />}
            </div>
            <Button variant="primary" className="w-full" disabled={understood === null || !trust || wouldAct === null} onClick={submit}>Submit feedback</Button>
          </>
        )}
        <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
          {alert.feedback.length ? <>Network: {alert.feedback.length} rating{alert.feedback.length > 1 ? 's' : ''} · average trust <b className="text-slate-700">{avg.toFixed(1)}/5</b></> : 'No ratings yet from other users.'}
        </div>
      </div>
    </Card>
  );
}

function ShareModal({ alert, open, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [targets, setTargets] = useState({ moph: true, hospitals: false, phcs: true });
  const [note, setNote] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Share2}
      title="Share alert with partners"
      subtitle="Only the de-identified, district-level summary is shared"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon={Send}
            disabled={!Object.values(targets).some(Boolean)}
            onClick={() => {
              const list = Object.entries(targets).filter(([, v]) => v).map(([k]) => ({ moph: 'MoPH surveillance unit', hospitals: 'Partner hospitals', phcs: 'Catchment PHCs' })[k]);
              dispatch({ type: 'AUDIT', action: 'SHARE', object: `Alert ${alert.id}`, detail: `Shared with ${list.join(', ')}` });
              toast('Alert shared', { desc: list.join(', ') });
              onClose();
            }}
          >
            Share summary
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Checkbox checked={targets.moph} onChange={(v) => setTargets((t) => ({ ...t, moph: v }))} label="Ministry of Public Health · epidemiological surveillance unit" />
        <Checkbox checked={targets.hospitals} onChange={(v) => setTargets((t) => ({ ...t, hospitals: v }))} label="Partner hospitals in the same district" />
        <Checkbox checked={targets.phcs} onChange={(v) => setTargets((t) => ({ ...t, phcs: v }))} label={`PHC centres in ${DISTRICT_MAP[alert.district].name}`} />
        <Field label="Message (optional)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context for recipients…" /></Field>
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <b>Preview:</b> {alert.title}. Expected +{alert.rise}% between {fmtShort(alert.windowStart)} and {fmtShort(alert.windowEnd)}. Drivers: {alert.signals.map((s) => lc(s.label)).join(', ')}.
        </div>
      </div>
    </Modal>
  );
}

export default function AlertDetail() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const loading = useSimulatedLoad(450, [id]);
  const alert = state.alerts.find((a) => a.id === id);
  const [planOpen, setPlanOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [comment, setComment] = useState('');
  const series = useMemo(() => (alert ? getSeries(alert.district, alert.condition) : []), [alert?.district, alert?.condition]);

  if (loading) return <PageSkeleton />;
  if (!alert)
    return (
      <Card className="mx-auto mt-6 max-w-xl">
        <EmptyState icon={SearchX} title="Alert not found" desc={`There is no alert with ID “${id}”. It may have been archived.`} action={<Link to="/app/alerts"><Button variant="primary">Back to alerts</Button></Link>} />
      </Card>
    );

  const c = CONDITION_MAP[alert.condition];
  const dist = DISTRICT_MAP[alert.district];
  const actions = state.actions.filter((a) => a.alertId === alert.id);
  const done = actions.filter((a) => a.status === 'done').length;
  const userName = (uid) => state.users.find((u) => u.id === uid)?.name || '—';
  const closed = ['resolved', 'dismissed'].includes(alert.status);
  const startsIn = Math.round((new Date(alert.windowStart) - TODAY) / 86400000);
  const top = [...alert.signals].sort((a, b) => b.weight - a.weight);
  const ws = series.find((d) => d.date.slice(0, 10) === alert.windowStart.slice(0, 10))?.date;
  const we = series.find((d) => d.date.slice(0, 10) === alert.windowEnd.slice(0, 10))?.date;

  return (
    <div>
      <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${c.color}, #2fb7a4)` }} />
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <ConditionTag id={alert.condition} />
                <SeverityBadge value={alert.severity} />
                <StatusBadge map={ALERT_STATUS} value={alert.status} />
                <span className="text-xs text-slate-400">{alert.id} · generated {fmtDateTime(alert.createdAt)}</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-navy-900">{alert.title}</h1>
              <p className="mt-1.5 text-[15px] text-slate-600">{alert.summary}</p>
            </div>
            <div className="no-print flex flex-wrap gap-2">
              {alert.status === 'new' && <Button icon={CheckCheck} onClick={() => { dispatch({ type: 'ALERT_STATUS', id: alert.id, status: 'acknowledged' }); toast('Alert acknowledged'); }}>Acknowledge</Button>}
              {!closed && (actions.length ? <Button variant="subtle" icon={ClipboardList} onClick={() => setPlanOpen(true)}>Add actions</Button> : <Button variant="primary" icon={ClipboardList} onClick={() => setPlanOpen(true)}>Create action plan</Button>)}
              {alert.status === 'action_planned' && <Button variant="teal" icon={CheckCircle2} onClick={() => { dispatch({ type: 'ALERT_STATUS', id: alert.id, status: 'resolved' }); toast('Alert resolved', { desc: 'Outcome will be compared with the forecast in the impact report.' }); }}>Mark resolved</Button>}
              <Button icon={Share2} onClick={() => setShareOpen(true)}>Share</Button>
              <Button icon={Printer} variant="ghost" onClick={() => window.print()} aria-label="Print" />
              {!closed && <Button variant="ghost" icon={XCircle} className="text-rose-600 hover:bg-rose-50" onClick={() => setDismissOpen(true)}>Dismiss</Button>}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 md:grid-cols-5">
            {[
              ['Expected rise', `+${alert.rise}%`, 'vs. seasonal baseline', c.color],
              ['Window', `${fmtShort(alert.windowStart)} – ${fmtShort(alert.windowEnd)}`, startsIn > 0 ? `starts in ${startsIn} days` : startsIn === 0 ? 'starts today' : 'past', null],
              ['Admissions / day', `${alert.baseline} → ${alert.expected}`, `${dist.name} partner hospitals`, null],
              ['Who', `Ages ${alert.ageGroups.map((g) => AGE_GROUPS.find((x) => x.id === g).label).join(', ')}`, `${dist.name}, ${dist.governorate}`, null],
              ['Confidence', `${Math.round(alert.confidence * 100)}%`, alert.confidence >= 0.75 ? 'high' : alert.confidence >= 0.6 ? 'moderate' : 'low', null],
            ].map(([l, v, s, color]) => (
              <div key={l}>
                <div className="text-xs font-medium text-slate-500">{l}</div>
                <div className="mt-1 text-lg font-bold text-navy-900" style={color ? { color } : undefined}>{v}</div>
                <div className="text-[11px] text-slate-500">{s}</div>
              </div>
            ))}
          </div>
          {alert.status === 'dismissed' && alert.dismissReason && <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"><b>Dismissed:</b> {alert.dismissReason}</div>}
          {alert.outcome && (
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Target className="h-5 w-5" />
              <span><b>Outcome:</b> observed +{alert.outcome.observedRise}% vs forecast +{alert.rise}% · lead time {alert.outcome.leadDays} days.</span>
              <span className="text-emerald-700">{alert.outcome.note}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Why */}
          <Card>
            <CardHeader title="Why this alert?" subtitle="What the model saw, and how much each signal contributed" icon={Lightbulb} />
            <div className="p-5">
              <div className="mb-5 rounded-xl bg-gradient-to-r from-brand-50 to-teal-50 p-4 text-[15px] leading-relaxed text-navy-900">
                <Sparkles className="mr-1.5 inline h-4 w-4 text-teal-600" />
                In plain words: <b>{lc(top[0].label)}</b> is the main driver ({top[0].weight}%), reinforced by <b>{lc(top[1]?.label)}</b> ({top[1]?.weight}%)
                {top[2] ? <> and <b>{lc(top[2].label)}</b> ({top[2].weight}%)</> : null}. Together they point to about <b>{alert.expected} admissions/day</b> in {dist.name} instead of the usual {alert.baseline}.
              </div>
              <div className="mb-6 flex h-4 overflow-hidden rounded-full">
                {top.map((s, i) => (
                  <div key={s.key} title={`${s.label} ${s.weight}%`} style={{ width: `${s.weight}%`, background: c.color, opacity: 1 - i * 0.2 }} className="border-r-2 border-white last:border-0" />
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {top.map((s, i) => {
                  const T = SIGNAL_TYPE[s.type] || SIGNAL_TYPE.baseline;
                  return (
                    <div key={s.key} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Badge className={T.cls}><T.I className="h-3 w-3" />{T.label}</Badge>
                        <span className="text-xl font-extrabold" style={{ color: c.color, opacity: 1 - i * 0.15 }}>{s.weight}%</span>
                      </div>
                      <div className="mt-2 font-semibold text-slate-900">{s.label}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{s.detail}</p>
                      <div className="mt-2"><Sparkline data={s.trend} color={c.color} height={40} /></div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>12 periods · {s.unit}</span>
                        <span>{s.trend[0]} → <b className="text-slate-600">{s.trend[s.trend.length - 1]}</b></span>
                      </div>
                      <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">Source: {s.source}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Forecast */}
          <Card>
            <CardHeader title={`Forecast · ${c.label} admissions in ${dist.name}`} subtitle="Observed vs. forecast with 80% interval; shaded area is the alert window" />
            <div className="p-5">
              <ForecastChart data={series} color={c.color} windowStart={ws} windowEnd={we} height={280} />
              <div className="mt-3"><ForecastLegend color={c.color} showWindow /></div>
            </div>
          </Card>

          {/* Action plan */}
          <Card>
            <CardHeader
              title="Action plan"
              subtitle={actions.length ? `${done} of ${actions.length} actions done` : 'No actions yet'}
              icon={ListChecks}
              actions={actions.length > 0 && <Link to={`/app/actions?alert=${alert.id}`}><Button size="sm" variant="ghost">Open board</Button></Link>}
            />
            {actions.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Turn this alert into action"
                desc={`Marsad suggests ${alert.suggested.length} action${alert.suggested.length === 1 ? '' : 's'}: ${alert.suggested.slice(0, 3).map((s) => lc(s.title)).join('; ')}.`}
                action={!closed && <Button variant="primary" icon={ClipboardList} onClick={() => setPlanOpen(true)}>Create action plan</Button>}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {actions.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <CategoryIcon id={a.category} />
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-sm font-medium', a.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800')}>{a.title}</div>
                      <div className="text-xs text-slate-500">{userName(a.owner)} · due {fmtShort(a.due)}</div>
                    </div>
                    <select
                      value={a.status}
                      onChange={(e) => { dispatch({ type: 'ACTION_UPDATE', id: a.id, patch: { status: e.target.value } }); toast(`Action → ${ACTION_STATUS[e.target.value].label}`); }}
                      className={cn('rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium ring-1 ring-inset', ACTION_STATUS[a.status].cls)}
                    >
                      {Object.entries(ACTION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader title="Activity & discussion" icon={History} />
            <div className="p-5">
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {[...alert.history].reverse().map((h, i) => (
                  <li key={i} className="relative">
                    <span className={cn('absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white', h.comment ? 'bg-brand-500' : 'bg-slate-300')} />
                    <div className="text-sm text-slate-800">{h.comment ? <span className="rounded-lg bg-slate-50 px-3 py-2 inline-block">{h.text}</span> : h.text}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{h.by} · {fmtRelative(h.at)}</div>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex gap-2">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note for your team…" className="min-h-[44px]" />
                <Button variant="primary" icon={MessageSquarePlus} disabled={!comment.trim()} onClick={() => { dispatch({ type: 'ALERT_COMMENT', id: alert.id, text: comment.trim() }); setComment(''); toast('Note added'); }}>Post</Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <FeedbackPanel alert={alert} />
          <Card>
            <CardHeader title="Who is affected" icon={Users2} />
            <div className="px-5 pb-3">
              <DefinitionList
                items={[
                  { label: 'District', value: `${dist.name} (${dist.governorate})` },
                  { label: 'Age groups', value: alert.ageGroups.map((g) => AGE_GROUPS.find((x) => x.id === g).label).join(', ') },
                  { label: 'District population', value: fmtNum(dist.population) },
                  { label: 'Extra admissions expected', value: `≈ ${Math.round((alert.expected - alert.baseline) * ((new Date(alert.windowEnd) - new Date(alert.windowStart)) / 86400000 + 1))}` },
                  { label: 'Partner coverage', value: dist.pilot ? 'Hospitals, labs, PHCs, pharmacies' : 'Pharmacies + public feeds only' },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Model card" icon={Cpu} />
            <div className="px-5 pb-3">
              <DefinitionList
                items={[
                  { label: 'Model', value: alert.model.version },
                  { label: 'Trained on', value: alert.model.trainedOn },
                  { label: 'Back-test error (MAPE)', value: `${Math.round(alert.model.backtestMape * 100)}%` },
                  { label: 'Median lead time', value: `${alert.model.medianLeadDays} days` },
                  { label: 'Horizon', value: `${alert.horizonDays} days` },
                ]}
              />
            </div>
          </Card>
          <Card className="border-teal-200 bg-teal-50/40">
            <div className="flex gap-3 p-5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-teal-600" />
              <div className="text-[13px] text-slate-700">
                <div className="font-semibold text-slate-900">Privacy by design</div>
                Built only from de-identified, district-level aggregates (minimum cell size k ≥ {state.settings.kAnonymity}). No patient names or identifiers leave partner systems. Viewing this alert is recorded in the audit log.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ActionPlanModal alert={alert} open={planOpen} onClose={() => setPlanOpen(false)} />
      <DismissModal alert={alert} open={dismissOpen} onClose={() => setDismissOpen(false)} />
      <ShareModal alert={alert} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
