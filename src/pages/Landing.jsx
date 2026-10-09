import { Link } from 'react-router-dom';
import {
  ArrowRight, Network, Radar, ClipboardCheck, TrendingUp, Activity, MessageSquareText, ShieldCheck, CheckCircle2, XCircle, Building2,
  FlaskConical, Stethoscope, Landmark, BedDouble, Pill, PhoneCall, Sunrise, Lock, Clock, Users, HeartPulse, Droplet, Wind, ChevronRight,
} from 'lucide-react';
import logoLockup from '../assets/logo-lockup.png';
import logoFull from '../assets/logo-full.png';
import logoMark from '../assets/logo-mark.png';
import { useStore } from '../store/AppStore';
import { PRICING_TIERS, DISTRICT_LICENCE_PRICE } from '../data/reference';
import { fmtMoney } from '../lib/utils';

function Nav() {
  const { auth } = useStore();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoMark} alt="" className="h-9 w-9" />
          <span className="text-xl font-extrabold tracking-tight text-navy-900">Marsad</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <a href="#how" className="hover:text-navy-900">How it works</a>
          <a href="#ai" className="hover:text-navy-900">AI</a>
          <a href="#compare" className="hover:text-navy-900">Why Marsad</a>
          <a href="#stakeholders" className="hover:text-navy-900">Who it's for</a>
          <a href="#pricing" className="hover:text-navy-900">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          {auth ? (
            <Link to="/app" className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy-800 px-4 text-sm font-semibold text-white hover:bg-navy-700">
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden h-9 items-center rounded-lg px-3 text-sm font-semibold text-navy-800 hover:bg-slate-100 sm:inline-flex">Sign in</Link>
              <Link to="/login" className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy-800 px-4 text-sm font-semibold text-white hover:bg-navy-700">
                Request pilot <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroMock() {
  const rows = [
    { c: 'Diabetes', d: 'Baabda', v: '+38%', w: 'in 3–10 days', color: '#1f6fbe', I: Droplet, sev: 'High' },
    { c: 'Cardiac', d: 'Baabda', v: '+31%', w: 'in 4–11 days', color: '#d6455d', I: HeartPulse, sev: 'High' },
    { c: 'Respiratory', d: 'Chouf', v: '+33%', w: 'in 2–9 days', color: '#179c8b', I: Wind, sev: 'High' },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-tr from-brand-200/50 via-teal-100/50 to-transparent blur-2xl" />
      <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-pop">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600"><Sunrise className="h-4 w-4" /> Morning brief · 07:45</div>
            <div className="mt-1 text-lg font-bold text-navy-900">3 things rising this week</div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"><Clock className="mr-1 inline h-3 w-3" />2-min read</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <div key={r.c} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: r.color + '18', color: r.color }}>
                <r.I className="h-[18px] w-[18px]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">{r.c} emergencies · {r.d}</div>
                <div className="text-xs text-slate-500">Expected {r.w}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-rose-600">{r.v}</div>
                <div className="text-[10px] font-semibold uppercase text-rose-500">{r.sev}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/60 p-3">
          <div className="text-xs font-semibold text-teal-800">Why this alert?</div>
          <div className="mt-2 space-y-1.5">
            {[['Rising HbA1c at partner labs', 42], ['Missed insulin refills', 31], ['Heatwave forecast', 19], ['Seasonal baseline', 8]].map(([l, w]) => (
              <div key={l} className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="w-40 truncate">{l}</span>
                <span className="h-1.5 flex-1 rounded-full bg-white"><span className="block h-full rounded-full bg-teal-500" style={{ width: `${w * 2}%` }} /></span>
                <span className="w-8 text-right font-semibold">{w}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[['Reserve beds', BedDouble], ['Check insulin stock', Pill], ['PHC calls', PhoneCall]].map(([t, I]) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-navy-800 px-3 py-1 text-xs font-medium text-white"><I className="h-3.5 w-3.5 text-teal-300" />{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_80%_0%,#d3e5f7_0%,transparent_60%),radial-gradient(40%_50%_at_0%_100%,#c9f1ea_0%,transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-xs font-semibold text-teal-700">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Now piloting in Mount Lebanon
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl lg:text-[56px]">
              See chronic-disease surges <span className="bg-gradient-to-r from-brand-500 to-teal-500 bg-clip-text text-transparent">7–14 days</span> before they reach the ER.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Marsad connects hospitals, labs and primary-care centres, combines their protected, anonymised data, and every morning tells each hospital what is rising and what to prepare.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex h-12 items-center gap-2 rounded-xl bg-navy-800 px-6 text-[15px] font-semibold text-white shadow-lg shadow-navy-800/20 hover:bg-navy-700">
                Sign in to Marsad <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-navy-800 hover:bg-slate-50">
                See how it works
              </a>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[['7–14', 'days of warning'], ['2 min', 'morning brief'], ['100%', 'explainable alerts']].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-extrabold text-navy-900">{v}</div>
                  <div className="text-xs text-slate-500">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <HeroMock />
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">The problem</div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">“I find out about a surge when the ER calls me.”</h2>
              <p className="mt-4 text-slate-600">Chronic-disease emergencies surge into hospitals without warning. The signs are already there, in labs, PHCs and pharmacies, but the data is fragmented and nobody can combine it securely.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
              {[
                ['Fragmented data', 'Hospital, lab and PHC data never meet.', Network],
                ['Backward-looking reports', 'Weeks late, with no forecasting.', Clock],
                ['Missed follow-up', "Patients skip care and nobody flags it.", PhoneCall],
                ['Stressors not linked', 'Heat, power cuts and shortages are ignored.', Activity],
              ].map(([t, d, I], i) => (
                <div key={t} className={`rounded-2xl border bg-white p-5 ${i === 0 ? 'border-rose-200 ring-2 ring-rose-100' : 'border-slate-200'}`}>
                  <I className={`h-5 w-5 ${i === 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                  <div className="mt-3 font-semibold text-slate-900">{t} {i === 0 && <span className="ml-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600">Root cause</span>}</div>
                  <div className="mt-1 text-sm text-slate-500">{d}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['Overwhelmed ERs & wards', 'Worse outcomes for chronic patients', 'Stock-outs & higher costs'].map((c) => (
              <div key={c} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                <XCircle className="h-4 w-4 text-rose-500" /> {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">How it works</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">A secure early-warning network for hospitals</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ['1', 'Connect', 'Hospitals, labs and PHCs share anonymised, permission-controlled data: lab results, admissions and prescription refills.', Network, 'from-brand-500 to-brand-600'],
            ['2', 'Detect', 'Marsad spots rising risk by district, condition and age group, and links it to heatwaves, power cuts or shortages.', Radar, 'from-teal-500 to-teal-600'],
            ['3', 'Act', 'A 2-minute morning brief with a risk map, a 7–14-day forecast and suggested actions for the team.', ClipboardCheck, 'from-navy-700 to-navy-900'],
          ].map(([n, t, d, I, g]) => (
            <div key={t} className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${g} text-white shadow-md`}>
                <I className="h-6 w-6" />
              </div>
              <div className="mt-5 text-xs font-bold text-slate-400">STEP {n}</div>
              <div className="mt-1 text-xl font-bold text-navy-900">{t}</div>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="scroll-mt-20 bg-navy-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-300">Where AI does real work</div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Forecasts you can trust because every alert explains itself</h2>
              <p className="mt-4 text-navy-100/80">Directors act on alerts they understand. Every Marsad alert shows the signals that fired it, their sources and how much each one contributed.</p>
              <Link to="/login" className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-teal-500 px-5 text-sm font-semibold text-white hover:bg-teal-400">
                Explore a live alert <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Forecasting', 'Admissions per district, 7–14 days ahead, with confidence intervals.', TrendingUp],
                ['Early signals', 'Unusual rises in lab values (HbA1c, NT-proBNP), missed refills.', Activity],
                ['Explainable alerts', 'Every alert shows why it fired and which data drove it.', MessageSquareText],
                ['Privacy by design', 'De-identified, role-based, audited. Never selling data.', ShieldCheck],
              ].map(([t, d, I]) => (
                <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <I className="h-6 w-6 text-teal-300" />
                  <div className="mt-3 font-semibold">{t}</div>
                  <div className="mt-1 text-sm text-navy-100/70">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-brand-50 via-white to-teal-50 p-8 ring-1 ring-slate-200 sm:p-12">
          <blockquote className="mx-auto max-w-4xl text-center text-xl font-semibold leading-relaxed text-navy-900 sm:text-2xl">
            “We help hospital medical directors see chronic-disease surges coming 7–14 days ahead, so their beds, staff and medicines are ready, and patients are treated before they reach the ER.”
          </blockquote>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <div className="text-sm font-bold uppercase tracking-wide text-rose-600">Pains we remove</div>
              <ul className="mt-4 space-y-2.5 text-[15px] text-slate-700">
                {['Surprise surges that fill the ER', 'Hours of phone calls and late reports', 'Panic orders and medicine stock-outs', 'Unsafe, informal data sharing'].map((p) => (
                  <li key={p} className="flex gap-2"><XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />{p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <div className="text-sm font-bold uppercase tracking-wide text-teal-600">Gains we create</div>
              <ul className="mt-4 space-y-2.5 text-[15px] text-slate-700">
                {['Time to plan beds, rotas and stock', "One view beyond the hospital's walls", 'Fewer avoidable admissions', 'Proof of impact for the board and Ministry'].map((p) => (
                  <li key={p} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" />{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Compare */}
      <section id="compare" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">Why Marsad</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">Easier than a phone call, and earlier</h2>
          <p className="mt-3 text-slate-600">A partner to hospital IT and the Ministry, not a replacement.</p>
        </div>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Alternative</th><th className="px-5 py-3">Does well</th><th className="px-5 py-3">Falls short</th><th className="px-5 py-3 text-teal-700">Marsad's edge</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Doing nothing', 'Free, no effort', 'Crisis at every surge; burnout', 'Preparation 7–14 days ahead'],
                ['Calls & WhatsApp', 'Fast and trusted', 'Depends on who you know; always late', 'Signals from every partner, early'],
                ['Excel & manual reports', 'Familiar and cheap', 'Weeks late; one hospital only', 'Automatic, multi-source, forward-looking'],
                ['Hospital IT dashboards', 'Real-time internal data', 'Sees one hospital; looks backwards', 'Network-wide view + explainable prediction'],
                ['National surveillance', 'Official, national', 'Periodic; mostly infectious disease', 'Chronic focus; feeds the Ministry'],
              ].map((r) => (
                <tr key={r[0]}>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{r[0]}</td>
                  <td className="px-5 py-3.5 text-slate-600">{r[1]}</td>
                  <td className="px-5 py-3.5 text-slate-600">{r[2]}</td>
                  <td className="px-5 py-3.5 font-medium text-teal-700"><CheckCircle2 className="mr-1.5 inline h-4 w-4" />{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Stakeholders */}
      <section id="stakeholders" className="scroll-mt-20 border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">Who it's for</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">Hospitals use it, patients benefit, many can pay</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Medical directors & ER heads', 'Morning brief, explainable alerts, action plans and readiness.', Building2],
              ['Labs & PHCs', 'Join free, share securely, get benchmarks back.', FlaskConical],
              ['Ministry, NSSF & donors', 'District-level view and proof of impact, never patient data.', Landmark],
              ['Patients & families', 'Called before they deteriorate; treated before the ER.', Users],
            ].map(([t, d, I]) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6">
                <I className="h-6 w-6 text-brand-600" />
                <div className="mt-3 font-semibold text-navy-900">{t}</div>
                <div className="mt-1 text-sm text-slate-500">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">Pricing</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">Hospitals pay. Labs and clinics join free.</h2>
          <p className="mt-3 text-slate-600">Annual subscription by hospital size. The first 3 months are a free pilot.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {PRICING_TIERS.map((t, i) => (
            <div key={t.id} className={`rounded-2xl border p-6 ${i === 1 ? 'border-navy-800 bg-navy-900 text-white shadow-pop' : 'border-slate-200 bg-white'}`}>
              <div className={`text-sm font-semibold ${i === 1 ? 'text-teal-300' : 'text-slate-500'}`}>{t.label}</div>
              <div className="mt-3 text-3xl font-extrabold">{fmtMoney(t.price)}<span className={`text-sm font-medium ${i === 1 ? 'text-navy-100/70' : 'text-slate-400'}`}> / year</span></div>
              <ul className={`mt-5 space-y-2 text-sm ${i === 1 ? 'text-navy-50' : 'text-slate-600'}`}>
                {['Daily 2-minute brief', 'Explainable alerts', 'Action plans & readiness', 'Monthly review, quarterly impact report'].map((f) => (
                  <li key={f} className="flex gap-2"><CheckCircle2 className={`h-4 w-4 shrink-0 ${i === 1 ? 'text-teal-300' : 'text-teal-500'}`} />{f}</li>
                ))}
              </ul>
            </div>
          ))}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
            <div className="text-sm font-semibold text-teal-700">District licence</div>
            <div className="mt-3 text-3xl font-extrabold text-navy-900">≈ {fmtMoney(DISTRICT_LICENCE_PRICE)}<span className="text-sm font-medium text-slate-500"> / year</span></div>
            <p className="mt-5 text-sm text-slate-600">For MoPH, insurers and donors: a district-level view across all partner hospitals.</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-teal-800"><Lock className="h-4 w-4" /> We never sell data.</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-brand-700 p-10 text-center text-white sm:p-14">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight">Help us run Marsad's first pilot</h2>
          <p className="max-w-2xl text-navy-100/80">Introductions to 3 hospitals and 1 lab network in Mount Lebanon, mentorship on health-data governance, and funding for a 3-month pilot.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-navy-900 hover:bg-slate-100">
              Sign in to the prototype <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
          <img src={logoLockup} alt="Marsad" className="h-12" />
          <div className="text-center text-xs text-slate-500 sm:text-right">
            <div>Team Marsad · Experia AI Health &amp; Wellbeing Hackathon · Challenge 4 · Forum de Beyrouth, October 2026</div>
            <div className="mt-1">Prototype. All data shown is synthetic and de-identified.</div>
          </div>
        </div>
      </footer>
      {/* preload full logo for login */}
      <link rel="prefetch" href={logoFull} />
    </div>
  );
}
