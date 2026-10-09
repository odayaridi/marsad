import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ClipboardList, XCircle, ChevronRight, CalendarDays, Users2 } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from './Toast';
import { Modal, Button, Field, Input, Select, Textarea, Checkbox, ConditionTag, SeverityBadge, StatusBadge, Badge } from './ui';
import Icon from './Icon';
import { ACTION_CATEGORIES, ACTION_CATEGORY_MAP, ALERT_STATUS, DISTRICT_MAP, AGE_GROUPS } from '../data/reference';
import { TODAY, addDays, dayKey, fmtShort, fmtRelative, cn } from '../lib/utils';

export function ownerOptions(users) {
  return users.filter((u) => u.status === 'active' && ['director', 'er_head', 'phc', 'admin'].includes(u.role)).map((u) => ({ value: u.id, label: `${u.name}${u.title ? ` (${u.title})` : ''}` }));
}

const DEFAULT_OWNER = { beds: 'u-karim', medicines: 'u-pharm', outreach: 'u-nadine', staff: 'u-karim', comms: 'u-rania' };

export function ActionPlanModal({ alert, open, onClose, onCreated }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const owners = ownerOptions(state.users);

  useEffect(() => {
    if (!open || !alert) return;
    const existing = new Set(state.actions.filter((a) => a.alertId === alert.id).map((a) => a.title));
    setItems(
      alert.suggested.map((s, i) => ({
        key: i,
        include: !existing.has(s.title),
        already: existing.has(s.title),
        category: s.category,
        title: s.title,
        detail: s.detail,
        owner: DEFAULT_OWNER[s.category] || 'u-rania',
        due: dayKey(addDays(TODAY, Math.min(2 + i, Math.max(1, Math.round((new Date(alert.windowStart) - TODAY) / 86400000))))),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alert?.id]);

  if (!alert) return null;
  const update = (k, patch) => setItems((xs) => xs.map((x) => (x.key === k ? { ...x, ...patch } : x)));
  const selected = items.filter((i) => i.include && !i.already && i.title.trim());

  const submit = () => {
    dispatch({
      type: 'ACTIONS_ADD',
      alertId: alert.id,
      actions: selected.map((s) => ({ alertId: alert.id, category: s.category, title: s.title.trim(), owner: s.owner, due: new Date(s.due + 'T12:00:00').toISOString(), note: s.detail })),
    });
    toast(`Action plan created · ${selected.length} action${selected.length > 1 ? 's' : ''}`, { desc: 'Owners have been notified. Track progress in Action Plans.' });
    onClose();
    onCreated?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={ClipboardList}
      title="Create action plan"
      subtitle={`${alert.id} · ${alert.title}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!selected.length} onClick={submit}>
            Create plan ({selected.length})
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-500">Marsad suggests these actions based on the forecast and your readiness data. Edit, assign owners and due dates, or add your own.</p>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.key} className={cn('rounded-xl border p-3.5 transition', it.include && !it.already ? 'border-teal-200 bg-teal-50/30' : 'border-slate-200 bg-white', it.already && 'opacity-60')}>
            <div className="flex items-start gap-3">
              <input type="checkbox" disabled={it.already} checked={it.include && !it.already} onChange={(e) => update(it.key, { include: e.target.checked })} className="mt-1 h-4 w-4 accent-teal-600" aria-label="Include action" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <select value={it.category} onChange={(e) => update(it.key, { category: e.target.value })} className="rounded-md border-0 bg-white py-1 pl-2 pr-7 text-xs font-medium ring-1 ring-slate-200">
                    {ACTION_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  {it.already && <Badge className="bg-slate-100 text-slate-600 ring-slate-200">Already in plan</Badge>}
                </div>
                <Input value={it.title} onChange={(e) => update(it.key, { title: e.target.value })} placeholder="Describe the action" disabled={it.already} />
                {it.detail && <div className="text-xs text-slate-500">{it.detail}</div>}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 shrink-0 text-slate-400" />
                    <Select className="flex-1" value={it.owner} onChange={(e) => update(it.key, { owner: e.target.value })} options={owners} disabled={it.already} />
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                    <Input type="date" value={it.due} onChange={(e) => update(it.key, { due: e.target.value })} className="flex-1" disabled={it.already} />
                  </div>
                </div>
              </div>
              {it.custom && (
                <button type="button" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setItems((xs) => xs.filter((x) => x.key !== it.key))} aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        icon={Plus}
        className="mt-3"
        onClick={() => setItems((xs) => [...xs, { key: Date.now(), include: true, custom: true, category: 'beds', title: '', detail: '', owner: 'u-rania', due: dayKey(addDays(TODAY, 2)) }])}
      >
        Add custom action
      </Button>
    </Modal>
  );
}

const DISMISS_REASONS = [
  'Already prepared (beds/stock sufficient)',
  'Duplicate of another alert or national surveillance signal',
  'Data quality issue at a partner feed',
  'Not relevant to our catchment',
  'Other',
];

export function DismissModal({ alert, open, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState(DISMISS_REASONS[0]);
  const [note, setNote] = useState('');
  if (!alert) return null;
  const submit = () => {
    dispatch({ type: 'ALERT_STATUS', id: alert.id, status: 'dismissed', reason: note ? `${reason}: ${note}` : reason });
    toast('Alert dismissed', { type: 'info', desc: 'Your reason helps Marsad improve future alerts.' });
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      icon={XCircle}
      title="Dismiss alert"
      subtitle={alert.id}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={submit} disabled={reason === 'Other' && !note.trim()}>Dismiss alert</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Reason" required>
          <Select value={reason} onChange={(e) => setReason(e.target.value)} options={DISMISS_REASONS.map((r) => ({ value: r, label: r }))} />
        </Field>
        <Field label="Note" hint={reason === 'Other' ? 'Required when reason is “Other”.' : 'Optional. Shared with the Marsad data science team.'}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context…" />
        </Field>
      </div>
    </Modal>
  );
}

export function AlertRow({ a, compact }) {
  const district = DISTRICT_MAP[a.district];
  return (
    <Link to={`/app/alerts/${a.id}`} className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-brand-200 hover:shadow-md">
      <div className={cn('mt-1 h-10 w-1 shrink-0 rounded-full', a.severity === 'high' ? 'bg-rose-500' : a.severity === 'medium' ? 'bg-amber-500' : 'bg-sky-500')} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ConditionTag id={a.condition} size="sm" />
          <span className="text-[11px] font-medium text-slate-400">{a.id}</span>
          {!compact && <StatusBadge map={ALERT_STATUS} value={a.status} />}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900 group-hover:text-brand-700">{a.title}</div>
        <div className="mt-0.5 text-xs text-slate-500">
          {district.name} · ages {a.ageGroups.map((g) => AGE_GROUPS.find((x) => x.id === g)?.label).join(', ')} · window {fmtShort(a.windowStart)}–{fmtShort(a.windowEnd)}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={cn('text-lg font-bold', a.severity === 'high' ? 'text-rose-600' : a.severity === 'medium' ? 'text-amber-600' : 'text-sky-600')}>+{a.rise}%</div>
        <div className="text-[11px] text-slate-400">{Math.round(a.confidence * 100)}% conf.</div>
      </div>
      <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
    </Link>
  );
}

export function CategoryIcon({ id, className = 'h-4 w-4' }) {
  const c = ACTION_CATEGORY_MAP[id];
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: (c?.color || '#64748b') + '18', color: c?.color }}>
      <Icon name={c?.icon} className={className} />
    </span>
  );
}

export { SeverityBadge, fmtRelative };
