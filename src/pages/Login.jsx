import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowLeft, ShieldCheck, Sunrise, MessageSquareText, Network, KeyRound } from 'lucide-react';
import { useStore } from '../store/AppStore';
import logoFull from '../assets/logo-full.png';
import { Button, Checkbox } from '../components/ui';

export default function Login() {
  const { auth, login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (auth) return <Navigate to="/app" replace />;

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (username.trim().toLowerCase() === 'admin' && password === '123456') {
        login(username.trim().toLowerCase());
        const to = location.state?.from && location.state.from.startsWith('/app') ? location.state.from : '/app';
        navigate(to, { replace: true });
      } else {
        setLoading(false);
        setError('Incorrect username or password. Failed attempts are logged.');
      }
    }, 650);
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-800">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <img src={logoFull} alt="Marsad: AI-powered chronic disease surveillance & early warning for hospitals" className="mx-auto mb-8 w-72" />
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Secure access for partner hospitals, labs, PHCs and the Ministry.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-700">Username</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="block h-11 w-full rounded-lg border-0 pl-9 pr-3 text-sm shadow-sm ring-1 ring-inset ring-slate-200 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-slate-700">
                Password
                <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setError('Password reset is handled by your organisation administrator in this prototype.')}>
                  Forgot password?
                </button>
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="block h-11 w-full rounded-lg border-0 pl-9 pr-10 text-sm shadow-sm ring-1 ring-inset ring-slate-200 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-400"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-700" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between">
              <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in on this device" />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-teal-300 bg-teal-50/60 p-3.5 text-[13px] text-teal-900">
            <div className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> Demo credentials</div>
            <div className="mt-1 text-teal-800">
              Username <code className="rounded bg-white px-1.5 py-0.5 font-semibold">admin</code> · Password <code className="rounded bg-white px-1.5 py-0.5 font-semibold">123456</code>
            </div>
            <button type="button" className="mt-2 text-xs font-semibold text-teal-700 hover:underline" onClick={() => { setUsername('admin'); setPassword('123456'); setError(''); }}>
              Fill in demo credentials
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Role-based access · every sign-in is audited
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,rgba(47,183,164,.35)_0%,transparent_60%),radial-gradient(60%_60%_at_0%_100%,rgba(31,111,190,.45)_0%,transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-center px-14 py-16 text-white">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-300">Marsad · “observatory”</div>
          <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight">A 2-minute morning view of what's rising, 7–14 days ahead.</h2>
          <div className="mt-10 space-y-5">
            {[
              [Sunrise, 'Morning brief', 'Risk map, forecast and suggested actions, ready for the 7:45 bed huddle.'],
              [MessageSquareText, 'Explainable alerts', 'Every alert shows why it fired: labs, refills, heat, power cuts.'],
              [Network, 'One secure network', 'Hospitals, labs and PHCs share anonymised, permission-controlled data.'],
            ].map(([I, t, d]) => (
              <div key={t} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-300"><I className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="text-sm text-navy-100/70">{d}</div>
                </div>
              </div>
            ))}
          </div>
          <figure className="mt-12 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
            <blockquote className="text-[15px] italic text-navy-50">“If I'd known 10 days earlier, we'd be ready.”</blockquote>
            <figcaption className="mt-2 text-xs text-navy-100/60">Medical director persona, 220-bed hospital, Baabda</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
