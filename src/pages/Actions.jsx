import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Columns3, List, CalendarDays, Trash2, FilterX, ClipboardCheck, AlertCircle, GripVertical } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, PageHeader, Button, Input, Select, Segmented, StatusBadge, Avatar, EmptyState, Modal, Field, Textarea, Drawer, Badge, Progress, PageSkeleton, ConditionTag } from '../components/ui';
import { CategoryIcon, ownerOptions } from '../components/alerts';
import { useSimulatedLoad, useLocalPref } from '../lib/hooks';
import { ACTION_STATUS, ACTION_CATEGORIES, ACTION_CATEGORY_MAP, DISTRICT_MAP } from '../data/reference';
import { fmtShort, fmtRelative, TODAY, addDays, dayKey, cn } from '../lib/utils';

const COLS = ['todo', 'in_progress', 'done'];

function ActionForm({ value, onChange, alerts, owners }) {
  return (
    <div className="space-y-4">
      <Field label="Action" required><Input value={value.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Reserve 4 internal-medicine beds" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category"><Select value={value.category} onChange={(e) => onChange({ category: e.target.value })} options={ACTION_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} /></Field>
        <Field label="Linked alert"><Select value={value.alertId || ''} onChange={(e) => onChange({ alertId: e.target.value || null })} options={[{ value: '', label: 'None (standalone)' }, ...alerts.map((a) => ({ value: a.id, label: `${a.id} · ${a.title.slice(0, 40)}` }))]} /></Field>
        <Field label="Owner"><Select value={value.owner} onChange={(e) => onChange({ owner: e.target.value })} options={owners} /></Field>
        <Field label="Due date"><Input type="date" value={value.due} onChange={(e) => onChange({ due: e.target.value })} /></Field>
      </div>
      <Field label="Notes"><Textarea value={value.note || ''} onChange={(e) => onChange({ note: e.target.value })} placeholder="Context, PO numbers, who to call…" /></Field>
    </div>
  );
}

export default function Actions() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const loading = useSimulatedLoad(400);
  const [params, setParams] = useSearchParams();
  const [view, setView] = useLocalPref('actions.view', 'board');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [owner, setOwner] = useState('all');
  const alertFilter = params.get('alert') || 'all';
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [edit, setEdit] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const owners = ownerOptions(state.users);
  const openAlerts = state.alerts.filter((a) => !['dismissed'].includes(a.status));
  const userName = (id) => state.users.find((u) => u.id === id)?.name || '—';

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return state.actions
      .filter((a) => (cat === 'all' || a.category === cat) && (owner === 'all' || a.owner === owner) && (alertFilter === 'all' || a.alertId === alertFilter))
      .filter((a) => !t || `${a.title} ${a.alertId} ${a.note || ''}`.toLowerCase().includes(t))
      .sort((a, b) => new Date(a.due) - new Date(b.due));
  }, [state.actions, q, cat, owner, alertFilter]);

  if (loading) return <PageSkeleton />;

  const total = rows.length;
  const doneN = rows.filter((r) => r.status === 'done').length;
  const overdue = rows.filter((r) => r.status !== 'done' && new Date(r.due) < TODAY).length;
  const anyFilter = q || cat !== 'all' || owner !== 'all' || alertFilter !== 'all';
  const startNew = () => { setDraft({ title: '', category: 'beds', owner: 'u-rania', due: dayKey(addDays(TODAY, 2)), alertId: alertFilter !== 'all' ? alertFilter : null, note: '' }); setNewOpen(true); };
  const move = (id, status) => {
    const a = state.actions.find((x) => x.id === id);
    if (!a || a.status === status) return;
    dispatch({ type: 'ACTION_UPDATE', id, patch: { status } });
    toast(`Moved to ${ACTION_STATUS[status].label}`, { desc: a.title });
  };

  const alertObj = alertFilter !== 'all' ? state.alerts.find((a) => a.id === alertFilter) : null;

  const renderCard = (a) => {
    const late = a.status !== 'done' && new Date(a.due) < TODAY;
    const linked = state.alerts.find((x) => x.id === a.alertId);
    return (
      <div
        key={a.id}
        draggable
        onDragStart={(e) => { setDragId(a.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragEnd={() => { setDragId(null); setOverCol(null); }}
        onClick={() => setEdit({ ...a, due: dayKey(a.due) })}
        className={cn('group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-brand-200 hover:shadow-md', dragId === a.id && 'opacity-40')}
      >
        <div className="flex items-start gap-2.5">
          <CategoryIcon id={a.category} />
          <div className="min-w-0 flex-1">
            <div className={cn('text-[13.5px] font-medium leading-snug', a.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800')}>{a.title}</div>
            {linked && <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><ConditionTag id={linked.condition} size="sm" /><span className="text-[11px] text-slate-400">{linked.id} · {DISTRICT_MAP[linked.district].name}</span></div>}
          </div>
          <GripVertical className="h-4 w-4 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={cn('inline-flex items-center gap-1 text-xs', late ? 'font-semibold text-rose-600' : 'text-slate-500')}>
            {late ? <AlertCircle className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
            {late ? 'Overdue · ' : ''}{fmtShort(a.due)}
          </span>
          <Avatar name={userName(a.owner)} size="xs" />
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Act"
        title="Action plans"
        subtitle="Beds, medicines, PHC calls and staffing: everything your team agreed to do because of an alert."
        actions={<Button variant="primary" icon={Plus} onClick={startNew}>New action</Button>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[13px] text-slate-500">Completion</div>
          <div className="mt-1 flex items-baseline gap-2"><span className="text-2xl font-bold text-navy-900">{total ? Math.round((doneN / total) * 100) : 0}%</span><span className="text-xs text-slate-500">{doneN} of {total} done</span></div>
          <Progress value={doneN} max={Math.max(1, total)} className="mt-2" />
        </Card>
        <Card className="p-4">
          <div className="text-[13px] text-slate-500">In progress</div>
          <div className="mt-1 text-2xl font-bold text-navy-900">{rows.filter((r) => r.status === 'in_progress').length}</div>
          <div className="text-xs text-slate-500">{rows.filter((r) => r.status === 'todo').length} not started</div>
        </Card>
        <Card className={cn('p-4', overdue && 'border-rose-200 bg-rose-50/40')}>
          <div className="text-[13px] text-slate-500">Overdue</div>
          <div className={cn('mt-1 text-2xl font-bold', overdue ? 'text-rose-600' : 'text-navy-900')}>{overdue}</div>
          <div className="text-xs text-slate-500">{overdue ? 'Needs follow-up today' : 'Nothing overdue'}</div>
        </Card>
      </div>

      {alertObj && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
          <span className="text-brand-800">Showing the plan for <Link to={`/app/alerts/${alertObj.id}`} className="font-semibold underline-offset-2 hover:underline">{alertObj.id} · {alertObj.title}</Link></span>
          <Button size="xs" variant="secondary" className="ml-auto" onClick={() => setParams({})}>Show all plans</Button>
        </div>
      )}

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions…" className="w-full sm:w-64" />
          <Select value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...ACTION_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]} className="w-40" />
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} options={[{ value: 'all', label: 'All owners' }, ...owners]} className="w-48" />
          <Select value={alertFilter} onChange={(e) => setParams(e.target.value === 'all' ? {} : { alert: e.target.value })} options={[{ value: 'all', label: 'All alerts' }, ...openAlerts.filter((a) => state.actions.some((x) => x.alertId === a.id)).map((a) => ({ value: a.id, label: a.id }))]} className="w-32" />
          {anyFilter && <Button size="sm" variant="ghost" icon={FilterX} onClick={() => { setQ(''); setCat('all'); setOwner('all'); setParams({}); }}>Clear</Button>}
          <div className="ml-auto">
            <Segmented size="sm" value={view} onChange={setView} options={[{ value: 'board', label: <span className="flex items-center gap-1"><Columns3 className="h-4 w-4" />Board</span> }, { value: 'list', label: <span className="flex items-center gap-1"><List className="h-4 w-4" />List</span> }]} />
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card><EmptyState icon={ClipboardCheck} title={anyFilter ? 'No actions match your filters' : 'No actions yet'} desc="Create an action plan from any alert, or add a standalone action." action={<Button variant="primary" icon={Plus} onClick={startNew}>New action</Button>} /></Card>
      ) : view === 'board' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLS.map((col) => {
            const items = rows.filter((r) => r.status === col);
            return (
              <div
                key={col}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
                onDragLeave={() => setOverCol(null)}
                onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, col); setDragId(null); setOverCol(null); }}
                className={cn('rounded-2xl border-2 border-dashed p-3 transition', overCol === col ? 'border-teal-400 bg-teal-50/50' : 'border-transparent bg-slate-100/70')}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge map={ACTION_STATUS} value={col} />
                    <span className="text-xs font-semibold text-slate-500">{items.length}</span>
                  </div>
                  {col === 'todo' && <button type="button" onClick={startNew} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700" aria-label="Add"><Plus className="h-4 w-4" /></button>}
                </div>
                <div className="min-h-[80px] space-y-2.5">
                  {items.map((a) => renderCard(a))}
                  {items.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">Drag actions here</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2.5">Action</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Alert</th><th className="px-4 py-2.5">Owner</th><th className="px-4 py-2.5">Due</th><th className="px-4 py-2.5">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => (
                <tr key={a.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setEdit({ ...a, due: dayKey(a.due) })}>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.title}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-2 text-xs text-slate-600"><CategoryIcon id={a.category} className="h-3.5 w-3.5" />{ACTION_CATEGORY_MAP[a.category]?.label}</span></td>
                  <td className="px-4 py-3 text-xs text-brand-600">{a.alertId || '—'}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-2 text-xs text-slate-700"><Avatar name={userName(a.owner)} size="xs" />{userName(a.owner)}</span></td>
                  <td className={cn('px-4 py-3 text-xs', a.status !== 'done' && new Date(a.due) < TODAY ? 'font-semibold text-rose-600' : 'text-slate-600')}>{fmtShort(a.due)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select value={a.status} onChange={(e) => move(a.id, e.target.value)} className={cn('rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium ring-1 ring-inset', ACTION_STATUS[a.status].cls)}>
                      {Object.entries(ACTION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        icon={Plus}
        title="New action"
        footer={
          <>
            <Button onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={!draft?.title?.trim()} onClick={() => {
              dispatch({ type: 'ACTIONS_ADD', alertId: draft.alertId, actions: [{ ...draft, title: draft.title.trim(), due: new Date(draft.due + 'T12:00:00').toISOString() }] });
              toast('Action created', { desc: `Assigned to ${userName(draft.owner)}` });
              setNewOpen(false);
            }}>Create action</Button>
          </>
        }
      >
        {draft && <ActionForm value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} alerts={openAlerts} owners={owners} />}
      </Modal>

      <Drawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title="Edit action"
        subtitle={edit ? `${edit.id} · created ${fmtRelative(edit.createdAt)}` : ''}
        footer={
          edit && (
            <>
              <Button variant="ghost" icon={Trash2} className="mr-auto text-rose-600 hover:bg-rose-50" onClick={() => { dispatch({ type: 'ACTION_DELETE', id: edit.id }); toast('Action deleted', { type: 'info' }); setEdit(null); }}>Delete</Button>
              <Button onClick={() => setEdit(null)}>Cancel</Button>
              <Button variant="primary" disabled={!edit.title.trim()} onClick={() => {
                const { id, title, category, owner: o, due, status, note, alertId } = edit;
                dispatch({ type: 'ACTION_UPDATE', id, patch: { title, category, owner: o, due: new Date(due + 'T12:00:00').toISOString(), status, note, alertId } });
                toast('Action updated');
                setEdit(null);
              }}>Save changes</Button>
            </>
          )
        }
      >
        {edit && (
          <div className="space-y-4">
            <Field label="Status">
              <div className="flex gap-2">
                {COLS.map((s) => (
                  <button type="button" key={s} onClick={() => setEdit((e) => ({ ...e, status: s }))} className={cn('flex-1 rounded-lg border px-3 py-2 text-sm font-medium', edit.status === s ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{ACTION_STATUS[s].label}</button>
                ))}
              </div>
            </Field>
            <ActionForm value={edit} onChange={(p) => setEdit((e) => ({ ...e, ...p }))} alerts={openAlerts} owners={owners} />
            {edit.completedAt && <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Completed {fmtRelative(edit.completedAt)}</Badge>}
          </div>
        )}
      </Drawer>
    </div>
  );
}
