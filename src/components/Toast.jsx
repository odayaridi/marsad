import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

const ToastCtx = createContext(null);

const ICONS = {
  success: { I: CheckCircle2, cls: 'text-emerald-500' },
  info: { I: Info, cls: 'text-brand-500' },
  warning: { I: AlertTriangle, cls: 'text-amber-500' },
  error: { I: XCircle, cls: 'text-rose-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (title, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, title, type: opts.type || 'success', desc: opts.desc }]);
      setTimeout(() => dismiss(id), opts.duration || 3800);
    },
    [dismiss],
  );
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const { I, cls } = ICONS[t.type] || ICONS.info;
          return (
            <div key={t.id} role="status" className="pointer-events-auto flex animate-slideUp items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-pop">
              <I className={cn('mt-0.5 h-5 w-5 shrink-0', cls)} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                {t.desc && <div className="mt-0.5 text-[13px] text-slate-500">{t.desc}</div>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const t = useContext(ToastCtx);
  if (!t) throw new Error('useToast must be used inside ToastProvider');
  return t;
}
