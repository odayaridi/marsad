import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, EyeOff, Users, ScrollText, Ban, Search, Download, Check, Minus, Save, FileCheck2, Lock, Clock, FilterX } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Tabs, Button, Input, Select, Toggle, Badge, Pagination, PageSkeleton, EmptyState, Field, Th, Avatar } from '../components/ui';
import { useSimulatedLoad, usePaged } from '../lib/hooks';
import { NAV, ROLES, ROLE_MAP } from '../data/reference';
import { fmtDateTime, toCSV, downloadText, cn } from '../lib/utils';

const ACTION_CLS = {
  VIEW: 'bg-slate-100 text-slate-600 ring-slate-200', EXPORT: 'bg-amber-50 text-amber-700 ring-amber-200', PERMISSION: 'bg-violet-50 text-violet-700 ring-violet-200',
  LOGIN: 'bg-sky-50 text-sky-700 ring-sky-200', LOGOUT: 'bg-sky-50 text-sky-700 ring-sky-200', REJECT: 'bg-rose-50 text-rose-700 ring-rose-200', INGEST: 'bg-teal-50 text-teal-700 ring-teal-200',
  CREATE: 'bg-brand-50 text-brand-700 ring-brand-200', UPDATE: 'bg-brand-50 text-brand-700 ring-brand-200', APPROVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200', SHARE: 'bg-amber-50 text-amber-700 ring-amber-200',
};

function Overview() {
  const { state } = useStore();
  const checks = [
    ['Data-sharing agreement signed with every live partner', true],
    ['De-identification performed at source (no names, IDs hashed)', true],
    ['Minimum cell size enforced on all outputs', state.settings.kAnonymity >= 5],
    ['Role-based access with MFA for clinical roles', state.users.filter((u) => u.status === 'active' && !u.mfa).length === 0],
    ['Audit log retained ≥ 24 months', state.settings.retentionMonths >= 24],
    ['Ethics committee approval for pilot analytics', true],
    ['Legal review against Lebanese personal-data law (Law 81/2018)', false],
    ['Annual third-party security & compliance audit', false],
  ];
  const done = checks.filter((c) => c[1]).length;
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
        {[
          [EyeOff, 'De-identified at source', 'Partners strip names and hash identifiers before data leaves their systems. Marsad never receives raw records.'],
          [Users, 'Role-based access', 'Each role sees only what it needs. PHCs see only their own call lists; the Ministry sees district aggregates only.'],
          [ScrollText, 'Everything audited', 'Every view, export, permission change and sign-in is logged with user, time and origin.'],
          [Ban, 'We never sell data', 'Revenue comes from subscriptions and licences, never from data. Partners can pause sharing at any time.'],
        ].map(([I, t, d]) => (
          <Card key={t} className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600"><I className="h-5 w-5" /></div>
            <div className="mt-3 font-semibold text-slate-900">{t}</div>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader title="Compliance checklist" subtitle={`${done} of ${checks.length} complete`} icon={FileCheck2} />
        <ul className="divide-y divide-slate-100">
          {checks.map(([t, ok]) => (
            <li key={t} className="flex items-start gap-3 px-5 py-2.5 text-sm">
              <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{ok ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}</span>
              <span className={ok ? 'text-slate-700' : 'text-slate-500'}>{t}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Anonymisation() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [s, setS] = useState({ kAnonymity: state.settings.kAnonymity, ageBanding: state.settings.ageBanding, districtOnly: state.settings.districtOnly, retentionMonths: state.settings.retentionMonths });
  const cells = [
    { d: 'Baabda', c: 'Diabetes', a: '65+', n: 142 }, { d: 'Baabda', c: 'Diabetes', a: '0–17', n: 4 }, { d: 'Aley', c: 'Cardiac', a: '45–64', n: 38 },
    { d: 'Chouf', c: 'Respiratory', a: '0–17', n: 9 }, { d: 'Matn', c: 'Cardiac', a: '65+', n: 97 }, { d: 'Jbeil', c: 'Respiratory', a: '18–44', n: 12 },
  ];
  const dirty = JSON.stringify(s) !== JSON.stringify({ kAnonymity: state.settings.kAnonymity, ageBanding: state.settings.ageBanding, districtOnly: state.settings.districtOnly, retentionMonths: state.settings.retentionMonths });
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Anonymisation rules" subtitle="Applied to every output: brief, alerts, exports, Ministry view" icon={Lock} />
        <div className="space-y-6 p-5">
          <Field label={`Minimum cell size (k-anonymity): ${s.kAnonymity}`} hint="Any group with fewer patients than this is suppressed in outputs.">
            <input type="range" min={3} max={25} value={s.kAnonymity} onChange={(e) => setS({ ...s, kAnonymity: Number(e.target.value) })} className="w-full accent-teal-600" />
          </Field>
          <Toggle label="Age banding" desc="Report ages in bands (0–17, 18–44, 45–64, 65+) instead of exact ages" checked={s.ageBanding} onChange={(v) => setS({ ...s, ageBanding: v })} />
          <Toggle label="District-level geography only" desc="No village or street-level locations in any output" checked={s.districtOnly} onChange={(v) => setS({ ...s, districtOnly: v })} />
          <Field label="Retention of de-identified records">
            <Select value={s.retentionMonths} onChange={(e) => setS({ ...s, retentionMonths: Number(e.target.value) })} options={[12, 24, 36, 60].map((m) => ({ value: m, label: `${m} months` }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button disabled={!dirty} onClick={() => setS({ kAnonymity: state.settings.kAnonymity, ageBanding: state.settings.ageBanding, districtOnly: state.settings.districtOnly, retentionMonths: state.settings.retentionMonths })}>Discard</Button>
            <Button variant="primary" icon={Save} disabled={!dirty} onClick={() => { dispatch({ type: 'SETTINGS_UPDATE', patch: s, section: 'Anonymisation rules' }); toast('Anonymisation rules saved', { desc: 'Applied to all new outputs and logged in the audit trail.' }); }}>Save rules</Button>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Suppression preview" subtitle={`How a sample output looks with k = ${s.kAnonymity}`} />
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60"><tr><Th>District</Th><Th>Condition</Th><Th>Age band</Th><Th className="text-right">Admissions</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {cells.map((c, i) => {
              const hidden = c.n < s.kAnonymity;
              return (
                <tr key={i} className={hidden ? 'bg-slate-50' : ''}>
                  <td className="px-4 py-2.5">{c.d}</td><td className="px-4 py-2.5">{c.c}</td><td className="px-4 py-2.5">{s.ageBanding ? c.a : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular">{hidden ? <Badge className="bg-slate-200 text-slate-600 ring-slate-300">&lt; {s.kAnonymity} · suppressed</Badge> : c.n}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 text-xs text-slate-500">{cells.filter((c) => c.n < s.kAnonymity).length} of {cells.length} cells suppressed. Higher k gives more privacy but less detail for small districts.</div>
      </Card>
    </div>
  );
}

function AccessMatrix() {
  const modules = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Role-based access matrix" subtitle="Which roles can open which modules. Changes are made by administrators and audited." icon={Users} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50/60">
            <tr>
              <Th>Module</Th>
              {ROLES.map((r) => <th key={r.id} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{r.short}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modules.map((m) => (
              <tr key={m.to}>
                <td className="px-4 py-2.5"><div className="font-medium text-slate-800">{m.label}</div><div className="text-[11px] text-slate-400">{m.group}</div></td>
                {ROLES.map((r) => (
                  <td key={r.id} className="px-2 py-2.5 text-center">
                    {m.roles.includes(r.id) ? <Check className="mx-auto h-4 w-4 text-teal-600" /> : <Minus className="mx-auto h-4 w-4 text-slate-300" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 p-4 text-xs text-slate-500">Data scope also differs by role: PHC coordinators see only their own centre's call lists; MoPH analysts see district-level aggregates only; lab directors see their own lab's contribution and benchmarks.</div>
    </Card>
  );
}

function AuditLog() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [action, setAction] = useState('all');
  const [role, setRole] = useState('all');
  const actions = [...new Set(state.audit.map((a) => a.action))].sort();
  const rows = useMemo(() => {
    const t = q.toLowerCase();
    return state.audit.filter((a) => (action === 'all' || a.action === action) && (role === 'all' || a.role === role) && (!t || `${a.user} ${a.object} ${a.detail}`.toLowerCase().includes(t)));
  }, [state.audit, q, action, role]);
  const paged = usePaged(rows, 15, q + action + role);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, object, detail…" className="w-full sm:w-64" />
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-40" options={[{ value: 'all', label: 'All actions' }, ...actions.map((a) => ({ value: a, label: a }))]} />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-48" options={[{ value: 'all', label: 'All roles' }, ...ROLES.map((r) => ({ value: r.id, label: r.label })), { value: 'system', label: 'System' }, { value: 'partner', label: 'Partner feed' }]} />
        {(q || action !== 'all' || role !== 'all') && <Button size="sm" variant="ghost" icon={FilterX} onClick={() => { setQ(''); setAction('all'); setRole('all'); }}>Clear</Button>}
        <Button className="ml-auto" icon={Download} onClick={() => {
          downloadText('marsad-audit-log.csv', toCSV(rows, [{ label: 'Time', value: 'at' }, { label: 'User', value: 'user' }, { label: 'Role', value: 'role' }, { label: 'Action', value: 'action' }, { label: 'Object', value: 'object' }, { label: 'Detail', value: 'detail' }, { label: 'Origin', value: 'ip' }]), 'text/csv');
          dispatch({ type: 'AUDIT', action: 'EXPORT', object: 'Audit log', detail: `${rows.length} entries · CSV` });
          toast('Audit log exported', { desc: 'This export has itself been logged.' });
        }}>Export</Button>
      </div>
      {rows.length === 0 ? <EmptyState icon={ScrollText} title="No audit entries match" /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50/60"><tr><Th>Time</Th><Th>User</Th><Th>Action</Th><Th>Object</Th><Th>Detail</Th><Th>Origin</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {paged.slice.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{fmtDateTime(a.at)}</td>
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar name={a.user} size="xs" /><div><div className="text-[13px] font-medium text-slate-800">{a.user}</div><div className="text-[11px] text-slate-400">{ROLE_MAP[a.role]?.label || a.role}</div></div></div></td>
                  <td className="px-4 py-2.5"><Badge className={ACTION_CLS[a.action] || undefined}>{a.action}</Badge></td>
                  <td className="px-4 py-2.5 text-[13px] text-slate-700">{a.object}</td>
                  <td className="max-w-[300px] px-4 py-2.5 text-xs text-slate-500">{a.detail}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination {...paged} />
    </Card>
  );
}

export default function Governance() {
  const loading = useSimulatedLoad(400);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  if (loading) return <PageSkeleton />;
  return (
    <div>
      <PageHeader eyebrow="Govern" title="Privacy & audit" subtitle="Privacy by design: de-identified, role-based, audited. Built for CIOs, data-protection officers and ethics committees." actions={<Badge className="bg-teal-50 text-teal-700 ring-teal-200"><ShieldCheck className="h-3.5 w-3.5" /> No patient-identifiable data stored</Badge>} />
      <Tabs className="mb-4" value={tab} onChange={(t) => setParams({ tab: t })} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'anonymisation', label: 'Anonymisation rules' }, { id: 'access', label: 'Access matrix' }, { id: 'audit', label: 'Audit log' }]} />
      {tab === 'overview' && <Overview />}
      {tab === 'anonymisation' && <Anonymisation />}
      {tab === 'access' && <AccessMatrix />}
      {tab === 'audit' && <AuditLog />}
    </div>
  );
}
