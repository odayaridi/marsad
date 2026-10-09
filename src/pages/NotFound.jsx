import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import logoMark from '../assets/logo-mark.png';

export default function NotFound({ inApp }) {
  const body = (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      {!inApp && <img src={logoMark} alt="Marsad" className="mb-6 h-16 w-16" />}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Compass className="h-6 w-6" /></div>
      <div className="text-sm font-semibold text-teal-600">404</div>
      <h1 className="mt-1 text-2xl font-bold text-navy-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to={inApp ? '/app' : '/'} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
        <ArrowLeft className="h-4 w-4" /> {inApp ? 'Back to dashboard' : 'Back to home'}
      </Link>
    </div>
  );
  return inApp ? body : <div className="min-h-screen bg-slate-50 px-4">{body}</div>;
}
