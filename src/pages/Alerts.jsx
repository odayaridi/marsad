import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Download, LayoutList, Table2, FilterX, BellOff, CheckCheck, MoreHorizontal, Eye, ClipboardList, XCircle } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, PageHeader, Button, Input, Select, Tabs, Segmented, ConditionTag, SeverityBadge, StatusBadge, EmptyState, Pagination, SortHeader, Th, sortRows, Skeleton, Dropdown, MenuItem, IconButton } from '../components/ui';
import { AlertRow, ActionPlanModal, DismissModal } from '../components/alerts';
import { useSimulatedLoad, usePaged, useLocalPref } from '../lib/hooks';
import { ALERT_STATUS, CONDITIONS, DISTRICTS, DISTRICT_MAP, AGE_GROUPS, SEVERITY } from '../data/reference';
import { fmtShort, fmtRelative, toCSV, downloadText, cn } from '../lib/utils';

const TABS = [
  { id: 'active', label: 'Active', match: (a) => ['new', 'acknowledged', 'action_planned'].includes(a.status) },
  { id: 'new', label: 'New', match: (a) => a.status === 'new' },
  { id: 'action_planned', label: 'Action planned', match: (a) => a.status === 'action_planned' },
  { id: 'closed', label: 'Resolved & dismissed', match: (a) => ['resolved', 'dismissed'].includes(a.status) },
  { id: 'all', label: 'All', match: () => true },
];

export default function Alerts() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const loading = useSimulatedLoad(400);
  const [params, setParams] = useSearchParams();
  const [view, setView] = useLocalPref('alerts.view', 'table');
  const [q, setQ] = useState('');
  const tab = params.get('tab') || 'active';
  const [cond, setCond] = useState(params.get('condition') || 'all');
  const [sev, setSev] = useState('all');
  const [district, setDistrict] = useState(params.get('district') || 'all');
  const [age, setAge] = useState('all');
  const [scope, setScope] = useState('all');
  const [sort, setSort] = useState({ key: 'severity', dir: 'desc' });
  const [planFor, setPlanFor] = useState(null);
  const [dismissFor, setDismissFor] = useState(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return state.alerts.filter((a) => {
      if (cond !== 'all' && a.condition !== cond) return false;
      if (sev !== 'all' && a.severity !== sev) return false;
      if (district !== 'all' && a.district !== district) return false;
      if (age !== 'all' && !a.ageGroups.includes(age)) return false;
      if (scope === 'catchment' && !state.settings.catchment.includes(a.district)) return false;
      if (t && !`${a.id} ${a.title} ${a.summary} ${DISTRICT_MAP[a.district].name}`.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [state.alerts, state.settings.catchment, q, cond, sev, district, age, scope]);

  const tabDef = TABS.find((t) => t.id === tab) || TABS[0];
  const rows = useMemo(
    () => sortRows(filtered.filter(tabDef.match), sort, { severity: (a) => SEVERITY[a.severity].rank * 1000 + a.rise, district: (a) => DISTRICT_MAP[a.district].name, window: (a) => a.windowStart }),
    [filtered, tabDef, sort],
  );
  const paged = usePaged(rows, 10, `${tab}${q}${cond}${sev}${district}${age}${scope}`);
  const anyFilter = q || cond !== 'all' || sev !== 'all' || district !== 'all' || age !== 'all' || scope !== 'all';
  const clear = () => { setQ(''); setCond('all'); setSev('all'); setDistrict('all'); setAge('all'); setScope('all'); };

  const exportCsv = () => {
    const csv = toCSV(rows, [
      { label: 'ID', value: 'id' }, { label: 'Title', value: 'title' }, { label: 'Condition', value: 'condition' },
      { label: 'District', value: (a) => DISTRICT_MAP[a.district].name }, { label: 'Age groups', value: (a) => a.ageGroups.join(' ') },
      { label: 'Expected rise %', value: 'rise' }, { label: 'Confidence', value: 'confidence' }, { label: 'Severity', value: 'severity' },
      { label: 'Window start', value: (a) => a.windowStart.slice(0, 10) }, { label: 'Window end', value: (a) => a.windowEnd.slice(0, 10) }, { label: 'Status', value: 'status' },
    ]);
    downloadText(`marsad-alerts-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv');
    dispatch({ type: 'AUDIT', action: 'EXPORT', object: 'Alerts list', detail: `${rows.length} rows · CSV` });
    toast('Export ready', { desc: `${rows.length} alerts exported as CSV.` });
  };

  const newCount = state.alerts.filter((a) => a.status === 'new').length;

  return (
    <div>
      <PageHeader
        eyebrow="Detect"
        title="Alerts"
        subtitle="Rising chronic-disease risk by district, condition and age group. Every alert explains why it fired."
        actions={
          <>
            {newCount > 0 && (
              <Button icon={CheckCheck} onClick={() => { state.alerts.filter((a) => a.status === 'new').forEach((a) => dispatch({ type: 'ALERT_STATUS', id: a.id, status: 'acknowledged' })); toast(`${newCount} alerts acknowledged`); }}>
                Acknowledge all new
              </Button>
            )}
            <Button icon={Download} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, district, keyword…" className="w-full sm:w-64" />
          <Select value={cond} onChange={(e) => setCond(e.target.value)} options={[{ value: 'all', label: 'All conditions' }, ...CONDITIONS.map((c) => ({ value: c.id, label: c.label }))]} className="w-40" />
          <Select value={sev} onChange={(e) => setSev(e.target.value)} options={[{ value: 'all', label: 'All severities' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} className="w-36" />
          <Select value={district} onChange={(e) => setDistrict(e.target.value)} options={[{ value: 'all', label: 'All districts' }, ...DISTRICTS.slice().sort((a, b) => a.name.localeCompare(b.name)).map((d) => ({ value: d.id, label: d.name }))]} className="w-40" />
          <Select value={age} onChange={(e) => setAge(e.target.value)} options={[{ value: 'all', label: 'All ages' }, ...AGE_GROUPS.map((g) => ({ value: g.id, label: `Age ${g.label}` }))]} className="w-32" />
          <Segmented size="sm" value={scope} onChange={setScope} options={[{ value: 'all', label: 'All network' }, { value: 'catchment', label: 'My catchment' }]} />
          {anyFilter && <Button size="sm" variant="ghost" icon={FilterX} onClick={clear}>Clear</Button>}
          <div className="ml-auto">
            <Segmented size="sm" value={view} onChange={setView} options={[{ value: 'table', label: <Table2 className="h-4 w-4" /> }, { value: 'cards', label: <LayoutList className="h-4 w-4" /> }]} />
          </div>
        </div>
        <Tabs className="px-3" value={tab} onChange={(t) => setParams((p) => { p.set('tab', t); return p; })} tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: filtered.filter(t.match).length }))} />

        {loading ? (
          <div className="space-y-2 p-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={BellOff} title={anyFilter ? 'No alerts match your filters' : 'No alerts in this view'} desc={anyFilter ? 'Try widening the filters or clearing the search.' : 'When Marsad detects rising risk, alerts appear here.'} action={anyFilter && <Button onClick={clear}>Clear filters</Button>} />
        ) : view === 'cards' ? (
          <div className="grid gap-2.5 p-4 lg:grid-cols-2">{paged.slice.map((a) => <AlertRow key={a.id} a={a} />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <SortHeader label="Alert" k="id" sort={sort} setSort={setSort} />
                  <Th>Condition</Th>
                  <SortHeader label="District" k="district" sort={sort} setSort={setSort} />
                  <Th>Ages</Th>
                  <SortHeader label="Rise" k="rise" sort={sort} setSort={setSort} />
                  <SortHeader label="Confidence" k="confidence" sort={sort} setSort={setSort} />
                  <SortHeader label="Window" k="window" sort={sort} setSort={setSort} />
                  <SortHeader label="Severity" k="severity" sort={sort} setSort={setSort} />
                  <Th>Status</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.slice.map((a) => (
                  <tr key={a.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => navigate(`/app/alerts/${a.id}`)}>
                    <td className="max-w-[320px] px-4 py-3">
                      <div className="font-medium text-slate-900">{a.title}</div>
                      <div className="text-xs text-slate-400">{a.id} · {fmtRelative(a.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3"><ConditionTag id={a.condition} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-700">{DISTRICT_MAP[a.district].name}{!DISTRICT_MAP[a.district].pilot && <div className="text-[11px] text-slate-400">outside pilot</div>}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.ageGroups.map((g) => AGE_GROUPS.find((x) => x.id === g).label).join(', ')}</td>
                    <td className={cn('px-4 py-3 font-bold tabular', a.severity === 'high' ? 'text-rose-600' : a.severity === 'medium' ? 'text-amber-600' : 'text-sky-600')}>+{a.rise}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${a.confidence * 100}%` }} /></div>
                        <span className="text-xs tabular text-slate-600">{Math.round(a.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{fmtShort(a.windowStart)} – {fmtShort(a.windowEnd)}</td>
                    <td className="px-4 py-3"><SeverityBadge value={a.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge map={ALERT_STATUS} value={a.status} /></td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <Dropdown trigger={<IconButton icon={MoreHorizontal} label="Alert actions" className="h-8 w-8" />} width="w-52">
                        <MenuItem icon={Eye} onClick={() => navigate(`/app/alerts/${a.id}`)}>Why this alert?</MenuItem>
                        {a.status === 'new' && <MenuItem icon={CheckCheck} onClick={() => { dispatch({ type: 'ALERT_STATUS', id: a.id, status: 'acknowledged' }); toast('Alert acknowledged'); }}>Acknowledge</MenuItem>}
                        {['new', 'acknowledged'].includes(a.status) && <MenuItem icon={ClipboardList} onClick={() => setPlanFor(a)}>Create action plan</MenuItem>}
                        {!['dismissed', 'resolved'].includes(a.status) && <MenuItem icon={XCircle} danger onClick={() => setDismissFor(a)}>Dismiss…</MenuItem>}
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length > 0 && <Pagination {...paged} />}
      </Card>
      <p className="text-xs text-slate-500">Severity: High ≥ 30% expected rise · Medium 15–29% · Low &lt; 15%. Alerts below your confidence threshold ({Math.round(state.settings.minConfidence * 100)}%) are hidden from the morning brief but kept here. <Link className="text-brand-600 hover:underline" to="/app/settings?tab=alerts">Change thresholds</Link></p>

      <ActionPlanModal alert={planFor} open={!!planFor} onClose={() => setPlanFor(null)} />
      <DismissModal alert={dismissFor} open={!!dismissFor} onClose={() => setDismissFor(null)} />
    </div>
  );
}
