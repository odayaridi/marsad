import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // In production this would be sent to monitoring.
    console.error('Marsad UI error', error, info);
  }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">This screen couldn't load</h2>
        <p className="mt-1 text-sm text-slate-500">An unexpected error occurred. Your data is safe. Try again, or reset the demo data from Settings.</p>
        <pre className="mt-4 max-h-24 overflow-auto rounded-lg bg-slate-50 p-2 text-left text-[11px] text-slate-500">{String(this.state.error?.message || this.state.error)}</pre>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={() => this.setState({ error: null })} className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                Object.keys(localStorage).filter((k) => k.startsWith('marsad.prototype.state')).forEach((k) => localStorage.removeItem(k));
              } catch { /* ignore */ }
              window.location.reload();
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Reset demo data
          </button>
        </div>
      </div>
    );
  }
}
