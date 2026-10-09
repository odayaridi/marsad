import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn, initials } from '../lib/utils';
import { CONDITION_MAP, SEVERITY } from '../data/reference';
import Icon from './Icon';

/* ---------------- Buttons ---------------- */
const BTN = {
  primary: 'bg-navy-800 text-white hover:bg-navy-700 shadow-sm focus-visible:ring-navy-300',
  brand: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm focus-visible:ring-brand-300',
  teal: 'bg-teal-500 text-white hover:bg-teal-600 shadow-sm focus-visible:ring-teal-300',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 shadow-sm focus-visible:ring-brand-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-300',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};
const SIZES = { xs: 'h-7 px-2.5 text-xs gap-1.5', sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-9 px-3.5 text-sm gap-2', lg: 'h-11 px-5 text-[15px] gap-2' };

export function Button({ variant = 'secondary', size = 'md', icon: I, iconRight: IR, className, children, loading, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        BTN[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : I ? <I className={size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> : null}
      {children}
      {IR && <IR className="h-4 w-4" />}
    </button>
  );
}

export function IconButton({ icon: I, label, className, badge, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} {...props} className={cn('relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800', className)}>
      <I className="h-[18px] w-[18px]" />
      {badge ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">{badge}</span> : null}
    </button>
  );
}

/* ---------------- Cards ---------------- */
export function Card({ className, children, ...props }) {
  return (
    <div {...props} className={cn('rounded-xl border border-slate-200/80 bg-white shadow-card', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions, icon: I, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {I && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <I className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-600">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------------- Badges ---------------- */
export function Badge({ className, children, dot }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', className || 'bg-slate-100 text-slate-700 ring-slate-200')}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

export function StatusBadge({ map, value }) {
  const s = map[value] || { label: value, cls: '' };
  return <Badge className={s.cls} dot={s.dot}>{s.label}</Badge>;
}

export function SeverityBadge({ value }) {
  const s = SEVERITY[value];
  return <Badge className={s.cls} dot={s.dot}>{s.label}</Badge>;
}

export function ConditionTag({ id, size = 'md' }) {
  const c = CONDITION_MAP[id];
  if (!c) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium', size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs')} style={{ background: c.soft, color: c.color }}>
      <Icon name={c.icon} className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}

/* ---------------- Form controls ---------------- */
export function Field({ label, hint, children, className, required }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputCls = 'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-400 outline-none';

export function Input({ className, icon: I, ...props }) {
  if (I)
    return (
      <div className={cn('relative', className)}>
        <I className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input {...props} className={cn(inputCls, 'pl-9')} />
      </div>
    );
  return <input {...props} className={cn(inputCls, className)} />;
}

export function Textarea({ className, ...props }) {
  return <textarea {...props} className={cn(inputCls, 'min-h-[84px]', className)} />;
}

export function Select({ className, options, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select {...props} className={cn(inputCls, 'appearance-none pr-8')}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || desc) && (
        <div>
          {label && <div className="text-sm font-medium text-slate-800">{label}</div>}
          {desc && <div className="text-xs text-slate-500">{desc}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition', checked ? 'bg-teal-500' : 'bg-slate-300')}
      >
        <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

export function Checkbox({ checked, onChange, label, className }) {
  return (
    <label className={cn('inline-flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700', className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600 accent-teal-600" />
      {label}
    </label>
  );
}

export function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'whitespace-nowrap rounded-md font-medium transition',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
            value === o.value ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-slate-200', className)}>
      {tabs.map((t) => (
        <button
          type="button"
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
            value === t.id ? 'border-teal-500 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-800',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className={cn('rounded-full px-1.5 text-[11px]', value === t.id ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Overlays ---------------- */
function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', icon: I }) {
  useEscape(open, onClose);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 animate-fadeIn bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn('relative my-8 w-full animate-slideUp rounded-2xl bg-white shadow-pop', w)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            {I && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <I className="h-[18px] w-[18px]" />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 animate-fadeIn bg-navy-950/30" onClick={onClose} />
      <div className={cn('absolute right-0 top-0 flex h-full w-full animate-slideIn flex-col bg-white shadow-pop', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Dropdown({ trigger, children, align = 'right', width = 'w-56' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className={cn('absolute z-50 mt-2 animate-slideUp rounded-xl border border-slate-200 bg-white p-1 shadow-pop', width, align === 'right' ? 'right-0' : 'left-0')} onClick={(e) => e.target.closest('[data-close]') && setOpen(false)}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: I, children, onClick, danger, active }) {
  return (
    <button type="button" data-close onClick={onClick} className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition', danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-100', active && 'bg-brand-50 text-brand-700')}>
      {I && <I className="h-4 w-4 shrink-0 opacity-70" />}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

/* ---------------- Feedback / states ---------------- */
export function EmptyState({ icon: I = Inbox, title, desc, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <I className="h-6 w-6" />
      </div>
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {desc && <p className="mt-1 max-w-sm text-sm text-slate-500">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', desc, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-rose-800">{title}</div>
        {desc && <div className="mt-0.5 text-sm text-rose-700">{desc}</div>}
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-shimmer rounded-md bg-[linear-gradient(90deg,#eef2f6_0%,#f8fafc_40%,#eef2f6_80%)] bg-[length:800px_100%]', className)} />;
}

export function PageSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-4 w-28" />
      <Skeleton className="mb-6 h-8 w-72" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export function Avatar({ name, size = 'md', className, color }) {
  const s = { xs: 'h-6 w-6 text-[10px]', sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' }[size];
  const palette = ['bg-brand-100 text-brand-700', 'bg-teal-100 text-teal-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700'];
  const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', s, color || palette[idx], className)}>{initials(name)}</span>;
}

export function Progress({ value, max = 100, className, color = 'bg-teal-500', height = 'h-1.5' }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-slate-100', height, className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${p}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub, icon: I, tone = 'brand', trend, onClick }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    teal: 'bg-teal-50 text-teal-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <Card className={cn('p-4', onClick && 'cursor-pointer transition hover:border-brand-200 hover:shadow-md')} onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-slate-500">{label}</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-navy-900">{value}</div>
          {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
        </div>
        {I && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
            <I className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      {trend}
    </Card>
  );
}

/* ---------------- Tables ---------------- */
export function SortHeader({ label, k, sort, setSort, className }) {
  const active = sort.key === k;
  const I = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={cn('px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500', className)}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800" onClick={() => setSort({ key: k, dir: active && sort.dir === 'desc' ? 'asc' : 'desc' })}>
        {label}
        <I className={cn('h-3 w-3', active ? 'text-brand-600' : 'opacity-50')} />
      </button>
    </th>
  );
}

export function Th({ children, className }) {
  return <th className={cn('px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500', className)}>{children}</th>;
}

export function Pagination({ page, pages, setPage, total, pageSize }) {
  if (pages <= 1) return <div className="px-4 py-3 text-xs text-slate-500">{total} result{total === 1 ? '' : 's'}</div>;
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <span>
        Showing {(page - 1) * pageSize + 1}–{Math.min(total, page * pageSize)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <IconButton icon={ChevronLeft} label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-7 w-7 disabled:opacity-40" />
        <span className="px-2 font-medium text-slate-700">
          {page} / {pages}
        </span>
        <IconButton icon={ChevronRight} label="Next page" disabled={page === pages} onClick={() => setPage(page + 1)} className="h-7 w-7 disabled:opacity-40" />
      </div>
    </div>
  );
}

export function sortRows(rows, sort, getters = {}) {
  if (!sort?.key) return rows;
  const g = getters[sort.key] || ((r) => r[sort.key]);
  return [...rows].sort((a, b) => {
    const x = g(a);
    const y = g(b);
    if (x === y) return 0;
    if (x === null || x === undefined) return 1;
    if (y === null || y === undefined) return -1;
    const r = x > y ? 1 : -1;
    return sort.dir === 'asc' ? r : -r;
  });
}

export function DefinitionList({ items }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map((it) => (
        <div key={it.label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
          <dt className="text-slate-500">{it.label}</dt>
          <dd className="text-right font-medium text-slate-800">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tip({ text, children }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[240px] -translate-x-1/2 rounded-md bg-navy-900 px-2 py-1 text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}
