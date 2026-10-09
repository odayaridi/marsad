import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, RotateCcw, Sunrise, BellRing, Bell, UserCircle2, Database, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Button, Input, Select, Toggle, Field, Checkbox, Modal, Avatar, Badge, Textarea } from '../components/ui';
import { CONDITIONS, DISTRICTS, ROLE_MAP } from '../data/reference';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserCircle2 },
  { id: 'brief', label: 'Morning brief', icon: Sunrise },
  { id: 'alerts', label: 'Alert thresholds', icon: BellRing },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'demo', label: 'Prototype data', icon: Database },
];

export default function SettingsPage() {
  const { state, dispatch, role, auth } = useStore();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'profile';
  const [s, setS] = useState(state.settings);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => setS(state.settings), [state.settings]);
  const dirty = JSON.stringify(s) !== JSON.stringify(state.settings);
  const persona = ROLE_MAP[role];
  const save = () => { dispatch({ type: 'SETTINGS_UPDATE', patch: s, section: `Settings · ${TABS.find((t) => t.id === tab)?.label}` }); toast('Settings saved'); };

  const footer = (
    <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
      <Button icon={RotateCcw} disabled={!dirty} onClick={() => setS(state.settings)}>Discard</Button>
      <Button variant="primary" icon={Save} disabled={!dirty} onClick={save}>Save changes</Button>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Settings" subtitle="Personalise the morning brief, alert thresholds and notifications." />
      <div className="grid gap-6 lg:grid-cols-4">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((t) => (
            <button type="button" key={t.id} onClick={() => setParams({ tab: t.id })} className={cn('flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition', tab === t.id ? 'bg-white text-navy-900 shadow-card ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70')}>
              <t.icon className={cn('h-4 w-4', tab === t.id ? 'text-teal-600' : 'text-slate-400')} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="lg:col-span-3">
          {tab === 'profile' && (
            <Card>
              <CardHeader title="Profile" subtitle="Your identity in Marsad (prototype persona for the current role)" />
              <div className="space-y-5 p-5">
                <div className="flex items-center gap-4">
                  <Avatar name={persona.persona} size="lg" />
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{persona.persona}</div>
                    <div className="text-sm text-slate-500">{persona.label} · {persona.org}</div>
                    <div className="mt-1 flex gap-2"><Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">MFA enabled</Badge><Badge>Signed in as {auth?.username}</Badge></div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display language"><Select value={s.language} onChange={(e) => setS({ ...s, language: e.target.value })} options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية (Arabic)' }, { value: 'fr', label: 'Français' }]} /></Field>
                  <Field label="Time zone"><Input value="Asia/Beirut (UTC+03:00)" disabled /></Field>
                </div>
              </div>
              {footer}
            </Card>
          )}

          {tab === 'brief' && (
            <Card>
              <CardHeader title="Morning brief" subtitle="When and how the 2-minute brief is delivered" icon={Sunrise} />
              <div className="space-y-5 p-5">
                <Field label="Delivery time" hint="Brief is generated after the overnight data sync, before the 7:45 bed huddle."><Input type="time" value={s.briefTime} onChange={(e) => setS({ ...s, briefTime: e.target.value })} className="w-40" /></Field>
                <Toggle label="Daily email brief" desc="Sent to the recipients below" checked={s.briefEmail} onChange={(v) => setS({ ...s, briefEmail: v })} />
                <Toggle label="WhatsApp summary (beta)" desc="Three-line summary with a secure link, no patient data" checked={s.briefWhatsapp} onChange={(v) => setS({ ...s, briefWhatsapp: v })} />
                <Field label="Recipients" hint="Comma-separated work emails"><Textarea value={s.briefRecipients} onChange={(e) => setS({ ...s, briefRecipients: e.target.value })} className="min-h-[60px]" /></Field>
                <Field label="Catchment districts" hint="The brief and 'My catchment' filters use these districts">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {DISTRICTS.filter((d) => d.pilot).map((d) => (
                      <Checkbox key={d.id} label={d.name} checked={s.catchment.includes(d.id)} onChange={(v) => setS({ ...s, catchment: v ? [...s.catchment, d.id] : s.catchment.filter((x) => x !== d.id) })} />
                    ))}
                  </div>
                  {s.catchment.length === 0 && <div className="mt-2 text-xs text-rose-600">Select at least one district.</div>}
                </Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <Button icon={RotateCcw} disabled={!dirty} onClick={() => setS(state.settings)}>Discard</Button>
                <Button variant="primary" icon={Save} disabled={!dirty || s.catchment.length === 0} onClick={save}>Save changes</Button>
              </div>
            </Card>
          )}

          {tab === 'alerts' && (
            <Card>
              <CardHeader title="Alert thresholds" subtitle="Which alerts appear in your morning brief" icon={BellRing} />
              <div className="space-y-6 p-5">
                <Field label={`Minimum confidence: ${Math.round(s.minConfidence * 100)}%`} hint="Alerts below this confidence stay in the Alerts list but are left out of the brief.">
                  <input type="range" min={0.4} max={0.9} step={0.05} value={s.minConfidence} onChange={(e) => setS({ ...s, minConfidence: Number(e.target.value) })} className="w-full accent-teal-600" />
                </Field>
                <Field label={`Minimum expected rise: ${s.minRise}%`}>
                  <input type="range" min={5} max={40} step={1} value={s.minRise} onChange={(e) => setS({ ...s, minRise: Number(e.target.value) })} className="w-full accent-teal-600" />
                </Field>
                <Field label="Conditions monitored">
                  <div className="flex flex-wrap gap-4">{CONDITIONS.map((c) => <Checkbox key={c.id} label={c.long} checked={s.conditions[c.id]} onChange={(v) => setS({ ...s, conditions: { ...s.conditions, [c.id]: v } })} />)}</div>
                </Field>
                <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800">With these settings, <b>{state.alerts.filter((a) => ['new', 'acknowledged', 'action_planned'].includes(a.status) && s.catchment.includes(a.district) && s.conditions[a.condition] && a.confidence >= s.minConfidence && a.rise >= s.minRise).length}</b> active alerts would appear in your brief.</div>
              </div>
              {footer}
            </Card>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader title="Notifications" subtitle="In-app and email notifications" icon={Bell} />
              <div className="space-y-5 p-5">
                <Toggle label="High-severity alerts" desc="Immediately, in-app + email" checked={s.notifyHigh} onChange={(v) => setS({ ...s, notifyHigh: v })} />
                <Toggle label="Medium-severity alerts" desc="In-app, and included in the brief" checked={s.notifyMedium} onChange={(v) => setS({ ...s, notifyMedium: v })} />
                <Toggle label="Low-severity alerts" desc="Brief only" checked={s.notifyLow} onChange={(v) => setS({ ...s, notifyLow: v })} />
                <Toggle label="Partner feed failures" desc="When a data feed fails or is delayed" checked={s.notifyFeeds} onChange={(v) => setS({ ...s, notifyFeeds: v })} />
                <Toggle label="Stock below reorder point" desc="Medicines at risk at forecast demand" checked={s.notifyStock} onChange={(v) => setS({ ...s, notifyStock: v })} />
              </div>
              {footer}
            </Card>
          )}

          {tab === 'demo' && (
            <Card>
              <CardHeader title="Prototype data" subtitle="This prototype stores all changes in your browser only" icon={Database} />
              <div className="space-y-4 p-5 text-sm text-slate-600">
                <p>Every alert status, action, call log, order, user and setting you change is saved locally so the demo survives page refreshes. No data is sent to a server.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[['Alerts', state.alerts.length], ['Actions', state.actions.length], ['Audit entries', state.audit.length]].map(([l, v]) => (
                    <div key={l} className="rounded-lg bg-slate-50 p-3"><div className="text-xl font-bold text-navy-900">{v}</div><div className="text-xs text-slate-500">{l}</div></div>
                  ))}
                </div>
                <Button variant="danger" icon={RotateCcw} onClick={() => setResetOpen(true)}>Reset demo data</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} icon={AlertTriangle} title="Reset demo data?" size="sm" footer={<><Button onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { dispatch({ type: 'RESET' }); setResetOpen(false); toast('Demo data reset', { desc: 'All changes reverted to the original sample data.' }); }}>Reset everything</Button></>}>
        <p className="text-sm text-slate-600">All alerts, actions, call logs, users, settings and audit entries will return to the original sample data. You will stay signed in.</p>
      </Modal>
    </div>
  );
}
