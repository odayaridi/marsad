import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, RefreshCw, Pause, Play, Database, Activity, Gauge, AlertOctagon, ArrowRight, ShieldCheck, FileSignature, ChevronRight, FileText, Lock, Building2, Sunrise, BellRing, Landmark, FilterX } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, PageHeader, Button, Input, Select, Tabs, StatusBadge, Badge, Stat, Drawer, Modal, Field, Checkbox, PageSkeleton, EmptyState, ErrorState, DefinitionList, Toggle, Th } from '../components/ui';
import Icon from '../components/Icon';
import { useSimulatedLoad } from '../lib/hooks';
import { PARTNER_TYPES, FEED_STATUS, AGREEMENT_STAGES, DATA_FIELDS, DISTRICTS, DISTRICT_MAP } from '../data/reference';
import { fmtRelative, fmtNum, fmtDate, TODAY, addDays, cn } from '../lib/utils';

function PartnerIcon({ type }) {
  const t = PARTNER_TYPES[type];
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: t.color + '18', color: t.color }}>
      <Icon name={t.icon} className="h-[18px] w-[18px]" />
    </span>
  );
}

function PartnerDrawer({ partner, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  if (!partner) return null;
  const retry = () => {
    setSyncing(true);
    setTimeout(() => {
      dispatch({ type: 'PARTNER_UPDATE', id: partner.id, patch: { status: 'live', lastSync: new Date().toISOString(), error: null }, auditAction: 'SYNC', auditDetail: 'Manual re-sync succeeded' });
      setSyncing(false);
      toast('Feed re-synced', { desc: `${partner.name} is live again. 2 days of files recovered.` });
    }, 1400);
  };
  const history = Array.from({ length: 7 }, (_, i) => {
    const ok = partner.status === 'error' ? i > 1 : partner.status === 'onboarding' ? false : partner.status === 'delayed' ? i !== 0 : true;
    return { date: addDays(TODAY, -i), ok, records: ok ? Math.round(partner.records30 / 30 * (0.85 + ((i * 37) % 30) / 100)) : 0 };
  });
  return (
    <Drawer open onClose={onClose} title={partner.name} subtitle={`${PARTNER_TYPES[partner.type].label} · ${DISTRICT_MAP[partner.district]?.name}`} width="max-w-xl">
      <div className="space-y-6">
        {partner.status === 'error' && <ErrorState title="Feed failing" desc={partner.error} onRetry={syncing ? undefined : retry} />}
        {syncing && <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-700"><RefreshCw className="h-4 w-4 animate-spin" /> Re-syncing feed and validating de-identification…</div>}
        <div className="flex flex-wrap gap-2">
          <StatusBadge map={FEED_STATUS} value={partner.status} />
          <Badge className="bg-slate-100 text-slate-600 ring-slate-200">Agreement: {AGREEMENT_STAGES.find((s) => s.id === partner.agreement)?.label}</Badge>
          {partner.quality !== null && <Badge className={partner.quality >= 90 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}>Quality {partner.quality}%</Badge>}
        </div>
        <DefinitionList
          items={[
            { label: 'Integration', value: partner.integration },
            { label: 'Last sync', value: partner.lastSync ? fmtRelative(partner.lastSync) : 'Not yet' },
            { label: 'Records (30 days)', value: fmtNum(partner.records30) },
            { label: 'Joined network', value: fmtDate(partner.joined) },
            { label: 'Contact', value: partner.contact },
            ...(partner.branches ? [{ label: 'Branches', value: partner.branches }] : []),
            ...(partner.beds ? [{ label: 'Beds', value: `${partner.beds} · ${partner.sector}` }] : []),
          ]}
        />
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-800">Data shared (permission-controlled)</div>
          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            {DATA_FIELDS.map((f) => (
              <Toggle
                key={f.id}
                label={f.label}
                desc={f.group}
                checked={partner.fields.includes(f.id)}
                onChange={(v) => {
                  const fields = v ? [...partner.fields, f.id] : partner.fields.filter((x) => x !== f.id);
                  dispatch({ type: 'PARTNER_UPDATE', id: partner.id, patch: { fields }, auditAction: 'PERMISSION', auditDetail: `${v ? 'Enabled' : 'Disabled'} sharing: ${f.label}` });
                  toast(v ? 'Sharing enabled' : 'Sharing disabled', { desc: f.label, type: 'info' });
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" /> De-identified at source · district & age-band aggregation · k ≥ 10</div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-800">Sync history (7 days)</div>
          <div className="grid grid-cols-7 gap-1.5">
            {history.reverse().map((h) => (
              <div key={h.date.toISOString()} className="text-center">
                <div className={cn('h-10 rounded-md', h.ok ? 'bg-emerald-400' : partner.status === 'onboarding' ? 'bg-slate-200' : 'bg-rose-400')} title={`${h.records} records`} />
                <div className="mt-1 text-[10px] text-slate-500">{h.date.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button icon={RefreshCw} loading={syncing} onClick={retry} disabled={partner.status === 'onboarding'}>Re-sync now</Button>
          {partner.status === 'paused' ? (
            <Button icon={Play} onClick={() => { dispatch({ type: 'PARTNER_UPDATE', id: partner.id, patch: { status: 'live' }, auditAction: 'UPDATE', auditDetail: 'Feed resumed' }); toast('Feed resumed'); }}>Resume feed</Button>
          ) : (
            <Button icon={Pause} disabled={partner.status === 'onboarding'} onClick={() => { dispatch({ type: 'PARTNER_UPDATE', id: partner.id, patch: { status: 'paused' }, auditAction: 'UPDATE', auditDetail: 'Feed paused' }); toast('Feed paused', { type: 'warning', desc: 'Forecasts will not use new data from this partner.' }); }}>Pause feed</Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function InviteModal({ open, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const empty = { name: '', type: 'phc', district: 'baabda', contact: '', email: '', fields: ['missed_visits'], integration: 'To be defined' };
  const [f, setF] = useState(empty);
  useEffect(() => { if (open) setF(empty); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const valid = f.name.trim() && f.contact.trim() && /\S+@\S+\.\S+/.test(f.email);
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Plus}
      title="Invite a partner"
      subtitle="Labs, PHCs and NGOs join free; hospitals start with a 3-month free pilot"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid} onClick={() => { dispatch({ type: 'PARTNER_ADD', partner: { ...f, name: f.name.trim() } }); toast('Invitation sent', { desc: `${f.name} · agreement created in Draft` }); onClose(); }}>Send invitation</Button></>}
    >
      <div className="space-y-4">
        <Field label="Organisation name" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Bourj Hammoud PHC" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} options={Object.entries(PARTNER_TYPES).filter(([k]) => k !== 'public').map(([k, v]) => ({ value: k, label: v.label }))} /></Field>
          <Field label="District"><Select value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })} options={DISTRICTS.map((d) => ({ value: d.id, label: d.name }))} /></Field>
          <Field label="Contact person" required><Input value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
          <Field label="Contact email" required hint={f.email && !/\S+@\S+\.\S+/.test(f.email) ? 'Enter a valid email' : undefined}><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        </div>
        <Field label="Data to request">
          <div className="grid gap-2 sm:grid-cols-2">
            {DATA_FIELDS.map((d) => (
              <Checkbox key={d.id} checked={f.fields.includes(d.id)} onChange={(v) => setF({ ...f, fields: v ? [...f.fields, d.id] : f.fields.filter((x) => x !== d.id) })} label={<span className="text-xs">{d.label}</span>} />
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

function Agreements() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const name = (a) => a.name || state.partners.find((p) => p.id === a.partnerId)?.name;
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {AGREEMENT_STAGES.map((st, idx) => {
        const items = state.agreements.filter((a) => a.stage === st.id);
        return (
          <div key={st.id} className="rounded-2xl bg-slate-100/70 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-700">{st.label}</span>
              <span className="rounded-full bg-white px-2 text-xs font-semibold text-slate-500">{items.length}</span>
            </div>
            <div className="space-y-2.5">
              {items.map((a) => (
                <Card key={a.id} className="p-3.5">
                  <div className="text-sm font-semibold text-slate-900">{name(a)}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{a.id} · updated {fmtRelative(a.updated)} · {a.owner}</div>
                  {a.docs.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{a.docs.map((d) => <span key={d} className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"><FileText className="h-3 w-3" />{d}</span>)}</div>}
                  <div className="mt-2 text-xs text-slate-600"><b>Next:</b> {a.next}</div>
                  {idx < AGREEMENT_STAGES.length - 1 && (
                    <Button size="xs" variant="subtle" className="mt-3 w-full" iconRight={ChevronRight} onClick={() => {
                      const next = AGREEMENT_STAGES[idx + 1];
                      dispatch({ type: 'AGREEMENT_UPDATE', id: a.id, patch: { stage: next.id, next: next.id === 'live' ? '—' : next.id === 'dsa' ? 'Technical go-live test' : 'Draft DSA with legal', docs: next.id === 'loi' ? [...a.docs, `LOI_${(name(a) || '').split(' ')[0]}.pdf`] : next.id === 'dsa' ? [...a.docs, `DSA_${(name(a) || '').split(' ')[0]}.pdf`] : a.docs } });
                      toast(`Moved to ${next.label}`, { desc: name(a) });
                    }}>
                      Advance to {AGREEMENT_STAGES[idx + 1].label}
                    </Button>
                  )}
                </Card>
              ))}
              {items.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">No agreements</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DataFlow() {
  const col = 'rounded-2xl border border-slate-200 bg-white p-4';
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1.1fr_auto_1fr]">
      <div className={col}>
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">1 · Sources (Connect)</div>
        {[['hospital', 'Hospitals', 'Admissions, ER visits, beds'], ['lab', 'Labs', 'HbA1c, NT-proBNP, eosinophils'], ['phc', 'PHCs', 'Missed visits, refills'], ['pharmacy', 'Pharmacies', 'Refills, stock'], ['public', 'Public feeds', 'Heat, power, air, shortages']].map(([t, l, d]) => (
          <div key={t} className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50 p-2.5"><PartnerIcon type={t} /><div><div className="text-sm font-medium text-slate-800">{l}</div><div className="text-[11px] text-slate-500">{d}</div></div></div>
        ))}
      </div>
      <div className="hidden items-center lg:flex"><ArrowRight className="h-6 w-6 text-slate-300" /></div>
      <div className="rounded-2xl border-2 border-teal-300 bg-gradient-to-b from-teal-50 to-white p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-700">2 · Marsad secure platform (Detect)</div>
        {[['De-identification at source', 'Pseudonymous IDs, no names leave partners', ShieldCheck], ['Aggregation', 'District × condition × age band, k ≥ 10', Database], ['Forecasting engine', '7–14-day admissions per district', Activity], ['Explainability', 'Signal contributions for every alert', Gauge]].map(([t, d, I]) => (
          <div key={t} className="mb-2 flex items-start gap-3 rounded-lg bg-white p-2.5 ring-1 ring-teal-100"><I className="mt-0.5 h-4 w-4 text-teal-600" /><div><div className="text-sm font-medium text-slate-800">{t}</div><div className="text-[11px] text-slate-500">{d}</div></div></div>
        ))}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-teal-800"><Lock className="h-3.5 w-3.5" /> Role-based access · every read & export audited</div>
      </div>
      <div className="hidden items-center lg:flex"><ArrowRight className="h-6 w-6 text-slate-300" /></div>
      <div className={col}>
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">3 · Outputs (Act)</div>
        {[['Morning brief', 'Hospitals · web + daily email', Sunrise], ['Explainable alerts', 'Directors, ER heads', BellRing], ['Benchmarks', 'Back to labs & PHCs, free', Building2], ['District view', 'MoPH, insurers, donors', Landmark]].map(([t, d, I]) => (
          <div key={t} className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50 p-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-teal-300"><I className="h-4 w-4" /></span><div><div className="text-sm font-medium text-slate-800">{t}</div><div className="text-[11px] text-slate-500">{d}</div></div></div>
        ))}
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const { state } = useStore();
  const loading = useSimulatedLoad(450);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('partners');
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const status = params.get('status') || 'all';
  const openId = params.get('partner');
  const [invite, setInvite] = useState(false);

  const rows = useMemo(() => state.partners.filter((p) => (type === 'all' || p.type === type) && (status === 'all' || p.status === status) && p.name.toLowerCase().includes(q.toLowerCase())), [state.partners, type, status, q]);
  if (loading) return <PageSkeleton />;

  const live = state.partners.filter((p) => p.status === 'live').length;
  const records = state.partners.reduce((s, p) => s + p.records30, 0);
  const withQ = state.partners.filter((p) => p.quality !== null);
  const quality = Math.round(withQ.reduce((s, p) => s + p.quality, 0) / withQ.length);
  const failing = state.partners.filter((p) => ['error', 'delayed'].includes(p.status)).length;
  const partner = state.partners.find((p) => p.id === openId);
  const setParam = (k, v) => setParams((p) => { if (v === null || v === 'all') p.delete(k); else p.set(k, v); return p; });

  return (
    <div>
      <PageHeader eyebrow="Connect" title="Data network" subtitle="Hospitals, labs, PHCs and pharmacies sharing anonymised, permission-controlled data." actions={<Button variant="primary" icon={Plus} onClick={() => setInvite(true)}>Invite partner</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Live partner feeds" value={`${live}/${state.partners.length}`} sub={`${state.partners.filter((p) => p.status === 'onboarding').length} onboarding`} icon={Activity} tone="teal" />
        <Stat label="Records (30 days)" value={fmtNum(records)} sub="De-identified at source" icon={Database} tone="brand" />
        <Stat label="Average data quality" value={`${quality}%`} sub="Completeness & timeliness" icon={Gauge} tone="violet" />
        <Stat label="Feeds needing attention" value={failing} sub="Error or delayed" icon={AlertOctagon} tone={failing ? 'rose' : 'teal'} onClick={() => { setTab('partners'); setParam('status', 'error'); }} />
      </div>

      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ id: 'partners', label: 'Partners', count: state.partners.length }, { id: 'agreements', label: 'Agreements', count: state.agreements.length }, { id: 'flow', label: 'How data flows' }]} />

      {tab === 'partners' && (
        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
            <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search partners…" className="w-full sm:w-60" />
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-44" options={[{ value: 'all', label: 'All types' }, ...Object.entries(PARTNER_TYPES).map(([k, v]) => ({ value: k, label: v.label }))]} />
            <Select value={status} onChange={(e) => setParam('status', e.target.value)} className="w-40" options={[{ value: 'all', label: 'All statuses' }, ...Object.entries(FEED_STATUS).map(([k, v]) => ({ value: k, label: v.label }))]} />
            {(q || type !== 'all' || status !== 'all') && <Button size="sm" variant="ghost" icon={FilterX} onClick={() => { setQ(''); setType('all'); setParam('status', null); }}>Clear</Button>}
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No partners match" desc="Adjust the filters or invite a new partner." action={<Button icon={Plus} onClick={() => setInvite(true)}>Invite partner</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-slate-50/60"><tr><Th>Partner</Th><Th>District</Th><Th>Data shared</Th><Th>Last sync</Th><Th className="text-right">Records 30 d</Th><Th className="text-right">Quality</Th><Th>Status</Th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((p) => (
                    <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setParam('partner', p.id)}>
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><PartnerIcon type={p.type} /><div><div className="font-medium text-slate-900">{p.name}</div><div className="text-xs text-slate-500">{PARTNER_TYPES[p.type].label} · {p.integration}</div></div></div></td>
                      <td className="px-4 py-3 text-slate-600">{DISTRICT_MAP[p.district]?.name}</td>
                      <td className="px-4 py-3"><div className="flex max-w-[220px] flex-wrap gap-1">{p.fields.length ? p.fields.map((f) => <span key={f} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{f.replace('_', ' ')}</span>) : <span className="text-xs text-slate-400">Public data</span>}</div></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{p.lastSync ? fmtRelative(p.lastSync) : '—'}</td>
                      <td className="px-4 py-3 text-right tabular">{fmtNum(p.records30)}</td>
                      <td className="px-4 py-3 text-right tabular">{p.quality !== null ? <span className={p.quality >= 90 ? 'text-emerald-700' : p.quality >= 85 ? 'text-slate-700' : 'text-amber-700'}>{p.quality}%</span> : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge map={FEED_STATUS} value={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      {tab === 'agreements' && <Agreements />}
      {tab === 'flow' && <DataFlow />}

      {partner && <PartnerDrawer partner={partner} onClose={() => setParam('partner', null)} />}
      <InviteModal open={invite} onClose={() => setInvite(false)} />
    </div>
  );
}
