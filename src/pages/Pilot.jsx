import { useState } from 'react';
import { FlaskRound, CheckCircle2, XCircle, CalendarDays, MessagesSquare, Flag, Target, Handshake, GraduationCap, Wallet, Pencil } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Badge, Select, PageSkeleton, Tabs, Modal, Textarea, Button, Field, Th } from '../components/ui';
import { useSimulatedLoad } from '../lib/hooks';
import { MVP_SESSIONS, INTERVIEW_QUESTIONS, PILOT } from '../data/seed';
import { ROLE_MAP } from '../data/reference';
import { fmtDate, addDays, TODAY, cn } from '../lib/utils';

const A_STATUS = {
  untested: 'bg-slate-100 text-slate-600 ring-slate-200',
  testing: 'bg-amber-50 text-amber-700 ring-amber-200',
  validated: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  invalidated: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function Criteria({ label, value, target, pass, detail }) {
  return (
    <div className={cn('rounded-xl border p-4', pass ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40')}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {pass ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-amber-600" />}
      </div>
      <div className="mt-2 text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-xs text-slate-500">Pass bar: {target}</div>
      {detail && <div className="mt-1 text-[11px] text-slate-400">{detail}</div>}
    </div>
  );
}

export default function Pilot() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const loading = useSimulatedLoad(400);
  const [tab, setTab] = useState('validation');
  const [editing, setEditing] = useState(null);
  if (loading) return <PageSkeleton />;

  const day = Math.round((TODAY - new Date(PILOT.startedAt)) / 86400000);
  const start = new Date(PILOT.startedAt);
  const milestones = [
    [0, 'Pilot kickoff · 3 hospitals + 1 lab network'],
    [7, 'First partner feeds live'],
    [14, 'First explainable alert issued'],
    [30, 'Month-1 review with directors'],
    [41, 'Network: 6 hospitals, 3 labs, 5 PHCs'],
    [60, 'Month-2 review + MVP trust test'],
    [75, 'Quarterly impact report to board & MoPH'],
    [90, 'Go / no-go: convert to subscription'],
  ];

  const s = MVP_SESSIONS;
  const live = state.alerts.flatMap((a) => a.feedback);
  const explained = s.filter((x) => x.explained).length;
  const action = s.filter((x) => x.action).length;
  const allTrust = [...s.map((x) => x.trust), ...live.map((f) => f.trust)];
  const trust = allTrust.reduce((a, b) => a + b, 0) / allTrust.length;
  const pilotN = s.filter((x) => x.wouldPilot).length;

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Pilot program" subtitle="90-day Mount Lebanon pilot: what we believe, how we're testing it, and what would prove it." />

      <Card className="mb-4 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-800">Day {day} of {PILOT.lengthDays} · {fmtDate(start)} → {fmtDate(addDays(start, PILOT.lengthDays))}</div>
          <Badge className="bg-teal-50 text-teal-700 ring-teal-200">On track</Badge>
        </div>
        <div className="relative">
          <div className="absolute left-0 right-0 top-[9px] h-1 rounded-full bg-slate-100" />
          <div className="absolute left-0 top-[9px] h-1 rounded-full bg-gradient-to-r from-brand-500 to-teal-500" style={{ width: `${(day / PILOT.lengthDays) * 100}%` }} />
          <div className="relative flex justify-between">
            {milestones.map(([d, l]) => (
              <div key={d} className="flex w-0 flex-col items-center">
                <span className={cn('h-5 w-5 rounded-full border-4 border-white shadow', d <= day ? 'bg-teal-500' : 'bg-slate-300')} />
                <span className={cn('mt-2 hidden w-28 text-center text-[11px] leading-tight md:block', d <= day ? 'text-slate-700' : 'text-slate-400')}>
                  <b className="block">Day {d}</b>{l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ id: 'validation', label: 'MVP validation' }, { id: 'assumptions', label: 'Assumptions', count: state.assumptions.length }, { id: 'interviews', label: 'Customer conversations' }, { id: 'ask', label: 'Our ask' }]} />

      {tab === 'validation' && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><Target className="h-4 w-4 text-rose-500" /> Riskiest assumption</div>
            <p className="text-[15px] text-slate-700">Directors will trust an alert and change what they do because of it.</p>
            <p className="mt-1 text-xs text-slate-500">Tested with clickable screens (morning brief → why this alert → action plan) with 6 users, plus live in-app feedback during the pilot.</p>
          </Card>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Criteria label="Explain the alert without help" value={`${explained} of 6`} target="4 of 6" pass={explained >= 4} />
            <Criteria label="Name a concrete action" value={`${action} of 6`} target="4 of 6" pass={action >= 4} />
            <Criteria label="Average trust score" value={`${trust.toFixed(1)} / 5`} target="≥ 4 / 5" pass={trust >= 4} detail={`${s.length} test sessions + ${live.length} live ratings`} />
            <Criteria label="Would pilot or share data" value={`${pilotN} of 6`} target="3 of 6" pass={pilotN >= 3} />
          </div>
          <Card className="overflow-hidden">
            <CardHeader title="Test sessions" subtitle="If we fail the bar, we rework explanations first; if trust stays low, we narrow to diabetes in one district." />
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60"><tr><Th>Participant</Th><Th>Role</Th><Th className="text-center">Explained</Th><Th className="text-center">Named action</Th><Th className="text-center">Trust</Th><Th className="text-center">Would pilot</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {s.map((x) => (
                  <tr key={x.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{x.participant}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{ROLE_MAP[x.role].label}</td>
                    {[x.explained, x.action].map((v, i) => <td key={i} className="px-4 py-2.5 text-center">{v ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" /> : <XCircle className="mx-auto h-4 w-4 text-slate-300" />}</td>)}
                    <td className="px-4 py-2.5 text-center font-semibold tabular">{x.trust}/5</td>
                    <td className="px-4 py-2.5 text-center">{x.wouldPilot ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" /> : <XCircle className="mx-auto h-4 w-4 text-slate-300" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'assumptions' && (
        <Card className="overflow-hidden">
          <CardHeader title="Evidence & learning" subtitle="Ordered by risk. The three HIGH assumptions decide whether Marsad works at all." icon={FlaskRound} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50/60"><tr><Th>Assumption</Th><Th>How we check it</Th><Th>What would prove it</Th><Th>Risk</Th><Th>Status</Th><Th>Evidence</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {state.assumptions.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-slate-800"><span className="mr-1 text-xs text-slate-400">{a.id}</span>{a.text}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.check}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.proof}</td>
                    <td className="px-4 py-3"><Badge className={a.risk === 'HIGH' ? 'bg-rose-50 text-rose-700 ring-rose-200' : a.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}>{a.risk}</Badge></td>
                    <td className="px-4 py-3">
                      <select value={a.status} onChange={(e) => { dispatch({ type: 'ASSUMPTION_UPDATE', id: a.id, patch: { status: e.target.value } }); toast(`${a.id} → ${e.target.value}`); }} className={cn('rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium capitalize ring-1 ring-inset', A_STATUS[a.status])}>
                        {Object.keys(A_STATUS).map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-xs text-slate-600">
                      <button type="button" className="group flex items-start gap-1 text-left hover:text-brand-700" onClick={() => setEditing({ ...a })}>
                        <span>{a.evidence || <span className="italic text-slate-400">Add evidence</span>}</span>
                        <Pencil className="mt-0.5 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'interviews' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title="Five questions about the past, never a pitch" subtitle="About real past events, never “would you…?”" icon={MessagesSquare} />
            <ol className="space-y-3 p-5">
              {INTERVIEW_QUESTIONS.map((q, i) => (
                <li key={q} className="flex gap-3 text-sm text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white">{i + 1}</span>{q}</li>
              ))}
            </ol>
            <div className="mx-5 mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><b>Assumption we most need to test:</b> chronic-disease surges regularly catch hospitals unprepared, and the warning signs already existed in labs, PHCs and pharmacies.</div>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title="Who we'll talk to" subtitle="Run in the two weeks after the event" icon={CalendarDays} />
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60"><tr><Th>Interviewee</Th><Th>Owner</Th><Th>Date</Th><Th>Status</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {state.interviews.map((iv) => (
                  <tr key={iv.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{iv.who}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{iv.owner}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{fmtDate(iv.date)}</td>
                    <td className="px-4 py-2.5">
                      <select value={iv.status} onChange={(e) => dispatch({ type: 'INTERVIEW_UPDATE', id: iv.id, patch: { status: e.target.value } })} className={cn('rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium ring-1 ring-inset', iv.status === 'done' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200')}>
                        <option value="scheduled">Scheduled</option><option value="done">Done</option><option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-100 p-4 text-xs text-slate-500">
              <div className="mb-1 font-semibold text-slate-700">Who does what, by when</div>
              Mon 12 Oct: Vanessa recruits & schedules · Fri 16 Oct: Juliana & Raman run chats 1–3; Sary & Rafic run chats 4–5 · Tue 20 Oct: whole team + advisor find patterns, update the pitch.
            </div>
          </Card>
        </div>
      )}

      {tab === 'ask' && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Handshake, 'Introductions', 'To 3 hospitals and 1 lab network in Mount Lebanon for the pilot.'],
            [GraduationCap, 'Mentorship', 'On health-data governance and privacy (DSAs, ethics, Law 81/2018).'],
            [Wallet, 'Pilot funding', 'To run a 3-month pilot: integration, hosting, security audit and team time. Amount to be set by the team.'],
          ].map(([I, t, d]) => (
            <Card key={t} className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-teal-300"><I className="h-5 w-5" /></div>
              <div className="mt-4 text-lg font-semibold text-navy-900">{t}</div>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </Card>
          ))}
          <Card className="p-5 md:col-span-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Flag className="h-4 w-4 text-teal-600" /> Our learning so far</div>
            <p className="mt-1 text-sm text-slate-600">We started from outbreaks and moved to chronic disease; from one patient to a network. We already built a working surveillance platform, and Marsad extends it with a 90-day pilot plan.</p>
          </Card>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Evidence · ${editing?.id}`} subtitle={editing?.text} size="sm" footer={<><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={() => { dispatch({ type: 'ASSUMPTION_UPDATE', id: editing.id, patch: { evidence: editing.evidence } }); toast('Evidence saved'); setEditing(null); }}>Save</Button></>}>
        {editing && <Field label="What have we learned?"><Textarea value={editing.evidence} onChange={(e) => setEditing({ ...editing, evidence: e.target.value })} /></Field>}
      </Modal>
    </div>
  );
}
