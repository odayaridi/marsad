import { useMemo, useState } from 'react';
import { UserPlus, Search, MoreHorizontal, ShieldCheck, ShieldAlert, Ban, RotateCcw, Mail, FilterX, Users as UsersIcon } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, PageHeader, Button, Input, Select, Badge, Avatar, Modal, Field, Dropdown, MenuItem, IconButton, EmptyState, PageSkeleton, Th } from '../components/ui';
import { useSimulatedLoad } from '../lib/hooks';
import { ROLES, ROLE_MAP } from '../data/reference';
import { fmtRelative, cn } from '../lib/utils';

const USTATUS = { active: 'bg-emerald-50 text-emerald-700 ring-emerald-200', invited: 'bg-brand-50 text-brand-700 ring-brand-200', suspended: 'bg-rose-50 text-rose-700 ring-rose-200' };

export default function Users() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const loading = useSimulatedLoad(400);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [f, setF] = useState({ name: '', email: '', role: 'director', org: 'Al-Arz Medical Center' });
  const [submitted, setSubmitted] = useState(false);

  const rows = useMemo(() => state.users.filter((u) => (role === 'all' || u.role === role) && (status === 'all' || u.status === status) && `${u.name} ${u.email} ${u.org}`.toLowerCase().includes(q.toLowerCase())), [state.users, q, role, status]);
  if (loading) return <PageSkeleton />;

  const emailOk = /^\S+@\S+\.\S+$/.test(f.email);
  const dup = state.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase());
  const valid = f.name.trim() && emailOk && !dup && f.org.trim();
  const upd = (u, patch, msg) => { dispatch({ type: 'USER_UPDATE', id: u.id, patch }); toast(msg, { desc: u.name }); };

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Users & roles" subtitle="Who can access Marsad and what they can see. Every change is audited." actions={<Button variant="primary" icon={UserPlus} onClick={() => { setF({ name: '', email: '', role: 'director', org: 'Al-Arz Medical Center' }); setSubmitted(false); setInviteOpen(true); }}>Invite user</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {ROLES.map((r) => (
          <button type="button" key={r.id} onClick={() => setRole(role === r.id ? 'all' : r.id)} className={cn('rounded-xl border bg-white p-3 text-left shadow-card transition hover:border-brand-200', role === r.id ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-200')}>
            <div className="text-xl font-bold text-navy-900">{state.users.filter((u) => u.role === r.id).length}</div>
            <div className="truncate text-[11px] font-medium text-slate-500">{r.label}</div>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, organisation…" className="w-full sm:w-72" />
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-52" options={[{ value: 'all', label: 'All roles' }, ...ROLES.map((r) => ({ value: r.id, label: r.label }))]} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36" options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'invited', label: 'Invited' }, { value: 'suspended', label: 'Suspended' }]} />
          {(q || role !== 'all' || status !== 'all') && <Button size="sm" variant="ghost" icon={FilterX} onClick={() => { setQ(''); setRole('all'); setStatus('all'); }}>Clear</Button>}
        </div>
        {rows.length === 0 ? <EmptyState icon={UsersIcon} title="No users match" desc="Try a different search or filter." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50/60"><tr><Th>User</Th><Th>Organisation</Th><Th>Role</Th><Th>MFA</Th><Th>Last active</Th><Th>Status</Th><Th /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} size="sm" /><div><div className="font-medium text-slate-900">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div></div></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{u.org}{u.title ? <div className="text-slate-400">{u.title}</div> : null}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} disabled={u.id === 'u-admin'} onChange={(e) => upd(u, { role: e.target.value }, `Role changed to ${ROLE_MAP[e.target.value].label}`)} className="rounded-md border-0 bg-white py-1 pl-2 pr-7 text-xs font-medium ring-1 ring-slate-200 disabled:bg-slate-50">
                        {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">{u.mfa ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200"><ShieldCheck className="h-3 w-3" />On</Badge> : <Badge className="bg-amber-50 text-amber-700 ring-amber-200"><ShieldAlert className="h-3 w-3" />Off</Badge>}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.lastActive ? fmtRelative(u.lastActive) : 'Never'}</td>
                    <td className="px-4 py-3"><Badge className={USTATUS[u.status]}>{u.status}</Badge></td>
                    <td className="px-2 py-3">
                      {u.id !== 'u-admin' && (
                        <Dropdown trigger={<IconButton icon={MoreHorizontal} label="User actions" className="h-8 w-8" />} width="w-52">
                          {u.status === 'invited' && <MenuItem icon={Mail} onClick={() => { dispatch({ type: 'AUDIT', action: 'INVITE', object: `User ${u.email}`, detail: 'Invitation re-sent' }); toast('Invitation re-sent', { desc: u.email }); }}>Resend invitation</MenuItem>}
                          {u.mfa && <MenuItem icon={RotateCcw} onClick={() => upd(u, { mfa: false }, 'MFA reset; user will re-enrol at next sign-in')}>Reset MFA</MenuItem>}
                          {!u.mfa && u.status === 'active' && <MenuItem icon={ShieldCheck} onClick={() => upd(u, { mfa: true }, 'MFA required for this user')}>Require MFA</MenuItem>}
                          {u.status !== 'suspended' ? <MenuItem icon={Ban} danger onClick={() => upd(u, { status: 'suspended' }, 'User suspended')}>Suspend access</MenuItem> : <MenuItem icon={RotateCcw} onClick={() => upd(u, { status: 'active' }, 'Access restored')}>Restore access</MenuItem>}
                        </Dropdown>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} icon={UserPlus} title="Invite user" subtitle="They'll receive an email to set a password and enrol MFA" footer={<><Button onClick={() => setInviteOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => { setSubmitted(true); if (!valid) return; dispatch({ type: 'USER_ADD', user: { ...f, name: f.name.trim() } }); toast('Invitation sent', { desc: f.email }); setInviteOpen(false); }}>Send invitation</Button></>}>
        <div className="space-y-4">
          <Field label="Full name" required hint={submitted && !f.name.trim() ? <span className="text-rose-600">Name is required</span> : undefined}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Dr. …" /></Field>
          <Field label="Work email" required hint={submitted && (!emailOk ? <span className="text-rose-600">Enter a valid email</span> : dup ? <span className="text-rose-600">A user with this email already exists</span> : undefined)}><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@hospital.lb" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} options={ROLES.filter((r) => r.id !== 'admin').map((r) => ({ value: r.id, label: r.label }))} /></Field>
            <Field label="Organisation" required><Input value={f.org} onChange={(e) => setF({ ...f, org: e.target.value })} /></Field>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><b>{ROLE_MAP[f.role].label}:</b> {ROLE_MAP[f.role].desc}</div>
        </div>
      </Modal>
    </div>
  );
}
