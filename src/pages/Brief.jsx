import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, MonitorPlay, CheckCircle2, Clock, ArrowRight, MessageSquareText, ClipboardList, TrendingUp, BedDouble, PackageX, ListChecks,
  Thermometer, Zap, Wind, PackageSearch, Database, X, Sunrise, ChevronRight, CircleCheck, Circle,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';
import { Card, CardHeader, Button, Stat, Segmented, PageSkeleton, ConditionTag, SeverityBadge, Badge, Modal, EmptyState, Progress, Avatar } from '../components/ui';
import { ForecastChart, ForecastLegend } from '../components/charts';
import RiskMap, { RiskLegend } from '../components/RiskMap';
import { ActionPlanModal, CategoryIcon } from '../components/alerts';
import { useSimulatedLoad } from '../lib/hooks';
import { getSeries, riskScore, overallRisk, stressorForecast, SHORTAGES, MY_HOSPITAL } from '../data/seed';
import { CONDITIONS, CONDITION_MAP, DISTRICT_MAP, ROLE_MAP, AGE_GROUPS } from '../data/reference';
import { fmtLongDate, fmtShort, fmtTime, greeting, TODAY, cn, fmtWeekday } from '../lib/utils';

const ACTIVE = ['new', 'acknowledged', 'action_planned'];

export function useBriefData() {
  const { state } = useStore();
  const catchment = state.settings.catchment;
  return useMemo(() => {
    const enabled = Object.entries(state.settings.conditions).filter(([, v]) => v).map(([k]) => k);
    const rising = state.alerts
      .filter((a) => ACTIVE.includes(a.status) && catchment.includes(a.district) && enabled.includes(a.condition) && a.confidence >= state.settings.minConfidence && a.rise >= state.settings.minRise)
      .sort((a, b) => (b.severity === 'high') - (a.severity === 'high') || b.rise - a.rise);
    const series = getSeries(catchment, 'all');
    const next14 = series.filter((d) => d.off > 0);
    const expected = next14.reduce((s, d) => s + d.forecast, 0);
    const base = next14.reduce((s, d) => s + d.baseline, 0);
    const stockRisk = state.stock.filter((s) => (s.onHand + (s.onOrder || 0)) / s.projectedUse < s.leadTimeDays + 7);
    const wards = state.wards;
    const peakOcc = Math.round((wards.reduce((s, w) => s + w.forecastPeak, 0) / wards.reduce((s, w) => s + w.beds, 0)) * 100);
    const openActions = state.actions.filter((a) => a.status !== 'done');
    const dueSoon = openActions.filter((a) => new Date(a.due) <= new Date(TODAY.getTime() + 2 * 86400000));
    return { rising, series, expected, base, stockRisk, peakOcc, openActions, dueSoon, catchment };
  }, [state, catchment]);
}

function RisingCard({ a, rank, onPlan }) {
  const c = CONDITION_MAP[a.condition];
  const startsIn = Math.max(0, Math.round((new Date(a.windowStart) - TODAY) / 86400000));
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="h-1" style={{ background: c.color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-800 text-[11px] font-bold text-white">{rank}</span>
            <ConditionTag id={a.condition} />
          </div>
          <SeverityBadge value={a.severity} />
        </div>
        <div className="mt-3 text-[15px] font-semibold leading-snug text-slate-900">{a.title}</div>
        <div className="mt-3 flex items-end gap-4">
          <div>
            <div className="text-3xl font-extrabold tracking-tight" style={{ color: c.color }}>+{a.rise}%</div>
            <div className="text-[11px] text-slate-500">vs. seasonal baseline</div>
          </div>
          <div className="pb-1 text-xs text-slate-600">
            <div><b>{startsIn === 0 ? 'Starting now' : `Starts in ${startsIn} day${startsIn > 1 ? 's' : ''}`}</b></div>
            <div>{fmtShort(a.windowStart)} – {fmtShort(a.windowEnd)} · {DISTRICT_MAP[a.district].name}</div>
            <div>Ages {a.ageGroups.map((g) => AGE_GROUPS.find((x) => x.id === g).label).join(', ')} · {Math.round(a.confidence * 100)}% confidence</div>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          {a.signals.slice(0, 3).map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <span className="w-44 truncate text-slate-600">{s.label}</span>
              <span className="h-1.5 flex-1 rounded-full bg-slate-100"><span className="block h-full rounded-full" style={{ width: `${s.weight * 2}%`, background: c.color }} /></span>
              <span className="w-8 text-right font-semibold text-slate-700">{s.weight}%</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex gap-2 pt-5">
          <Link to={`/app/alerts/${a.id}`} className="flex-1">
            <Button size="sm" className="w-full" icon={MessageSquareText}>Why this alert?</Button>
          </Link>
          {a.status === 'action_planned' ? (
            <Link to={`/app/actions?alert=${a.id}`} className="flex-1">
              <Button size="sm" variant="subtle" className="w-full" icon={ListChecks}>View plan</Button>
            </Link>
          ) : (
            <Button size="sm" variant="primary" className="flex-1" icon={ClipboardList} onClick={() => onPlan(a)}>Action plan</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function StressorTile({ icon: I, label, value, sub, hot }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-3.5', hot ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white')}>
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', hot ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
        <I className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-900">{value}</div>
        <div className="text-[11px] text-slate-500">{sub}</div>
      </div>
    </div>
  );
}

function EmailPreview({ open, onClose, data }) {
  const { state } = useStore();
  return (
    <Modal open={open} onClose={onClose} size="lg" icon={Mail} title="Daily email brief · preview" subtitle={`Sent every day at ${state.settings.briefTime} to ${state.settings.briefRecipients}`}>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="space-y-1 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          <div><b className="text-slate-700">From:</b> Marsad Brief &lt;brief@marsad.health&gt;</div>
          <div><b className="text-slate-700">Subject:</b> ☀️ {fmtWeekday(TODAY)}: {data.rising.length} things rising in your catchment</div>
        </div>
        <div className="bg-white px-6 py-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">Marsad morning brief · {MY_HOSPITAL.name}</div>
          <h3 className="mt-1 text-xl font-bold text-navy-900">What's rising in the next 7–14 days</h3>
          <ol className="mt-4 space-y-3">
            {data.rising.slice(0, 3).map((a, i) => (
              <li key={a.id} className="rounded-lg border border-slate-200 p-3">
                <div className="text-sm font-semibold text-slate-900">{i + 1}. {a.title} <span className="text-rose-600">(+{a.rise}%)</span></div>
                <div className="mt-1 text-xs text-slate-500">Why: {a.signals.slice(0, 3).map((s) => s.label).join(' · ')}</div>
                <div className="mt-1 text-xs text-slate-700">Suggested: {a.suggested.slice(0, 3).map((s) => s.title).join('; ')}</div>
              </li>
            ))}
          </ol>
          <div className="mt-4 text-sm text-slate-600">Expected chronic admissions (next 14 days): <b>{Math.round(data.expected)}</b> vs. baseline {Math.round(data.base)}.</div>
          <div className="mt-5"><span className="inline-block rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Open full brief in Marsad →</span></div>
          <p className="mt-6 border-t border-slate-100 pt-3 text-[11px] text-slate-400">Contains de-identified, district-level aggregates only. Do not forward outside your organisation.</p>
        </div>
      </div>
    </Modal>
  );
}

function HuddleMode({ open, onClose, data }) {
  const { state } = useStore();
  const userName = (id) => state.users.find((u) => u.id === id)?.name || '—';
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-navy-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-teal-300"><Sunrise className="h-5 w-5" /> 7:45 bed huddle · {MY_HOSPITAL.name}</div>
            <div className="mt-1 text-3xl font-bold">{fmtLongDate(TODAY)}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10"><X className="mr-1 inline h-4 w-4" /> Exit (Esc)</button>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {data.rising.slice(0, 3).map((a, i) => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-navy-100/70">#{i + 1} · {CONDITION_MAP[a.condition].label} · {DISTRICT_MAP[a.district].name}</div>
              <div className="mt-2 text-5xl font-extrabold text-rose-300">+{a.rise}%</div>
              <div className="mt-2 text-lg font-semibold leading-snug">{a.title}</div>
              <div className="mt-3 text-sm text-navy-100/80">{fmtShort(a.windowStart)} – {fmtShort(a.windowEnd)} · {Math.round(a.confidence * 100)}% confidence</div>
              <ul className="mt-4 space-y-1.5 text-sm text-navy-50">
                {a.suggested.slice(0, 3).map((s) => <li key={s.title} className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />{s.title}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Beds: now → forecast peak</div>
            <div className="mt-4 space-y-3">
              {state.wards.map((w) => {
                const pct = Math.round((w.forecastPeak / w.beds) * 100);
                return (
                  <div key={w.id}>
                    <div className="flex justify-between text-sm"><span>{w.name}</span><span className={pct >= 95 ? 'font-bold text-rose-300' : 'text-navy-100/80'}>{w.occupied}/{w.beds} → {w.forecastPeak} ({pct}%) {w.reserved ? `· ${w.reserved} reserved` : ''}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-white/10"><div className={cn('h-full rounded-full', pct >= 95 ? 'bg-rose-400' : pct >= 85 ? 'bg-amber-400' : 'bg-teal-400')} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Actions due in the next 48 h</div>
            <div className="mt-4 space-y-2.5">
              {data.dueSoon.length === 0 && <div className="text-navy-100/70">Nothing due. 🎉</div>}
              {data.dueSoon.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-navy-100/70">{userName(a.owner)} · due {fmtShort(a.due)}</div>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', a.status === 'in_progress' ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10')}>{a.status === 'in_progress' ? 'In progress' : 'To do'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Brief() {
  const { state, dispatch, role } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const loading = useSimulatedLoad(500);
  const data = useBriefData();
  const [cond, setCond] = useState('all');
  const [planFor, setPlanFor] = useState(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [huddle, setHuddle] = useState(false);
  const series = useMemo(() => getSeries(data.catchment, cond), [data.catchment, cond]);
  const stress = useMemo(() => stressorForecast(), []);
  const userName = (id) => state.users.find((u) => u.id === id)?.name || '—';
  const persona = ROLE_MAP[role];
  const reviewedToday = state.briefReviewed?.date === new Date().toDateString();

  const mapValues = useMemo(() => {
    const v = {};
    for (const id of data.catchment) v[id] = cond === 'all' ? overallRisk(id) : riskScore(id, cond);
    return v;
  }, [data.catchment, cond]);

  const pending = useMemo(() => {
    const existing = new Set(state.actions.map((a) => a.alertId + a.title));
    return data.rising.flatMap((a) => a.suggested.filter((s) => !existing.has(a.id + s.title)).map((s) => ({ ...s, alert: a }))).slice(0, 5);
  }, [data.rising, state.actions]);

  if (loading) return <PageSkeleton />;

  const heatDays = stress.filter((s) => s.heat >= 38).length;
  const minPower = Math.min(...stress.map((s) => s.power));
  const dustDays = stress.filter((s) => s.pm10 >= 120).length;
  const live = state.partners.filter((p) => p.status === 'live').length;
  const failing = state.partners.filter((p) => p.status === 'error').length;
  const firstName = persona.persona.replace(/^Dr\.\s*/, 'Dr. ').split(' ').slice(0, 2).join(' ');

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600">
            <Sunrise className="h-4 w-4" /> {fmtLongDate(TODAY)} · generated {state.settings.briefTime}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">{greeting()}, {role === 'admin' ? 'Admin' : firstName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.rising.length ? <>Here's what's rising across your catchment ({data.catchment.map((d) => DISTRICT_MAP[d].name).join(', ')}) in the next 7–14 days.</> : 'Nothing above your alert thresholds this morning.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-white text-slate-600 ring-slate-200"><Clock className="h-3 w-3" /> 2-min read</Badge>
          <Button icon={Mail} onClick={() => setEmailOpen(true)}>Email preview</Button>
          <Button icon={MonitorPlay} onClick={() => setHuddle(true)}>Huddle mode</Button>
          <Button
            variant={reviewedToday ? 'subtle' : 'teal'}
            icon={CheckCircle2}
            disabled={reviewedToday}
            onClick={() => { dispatch({ type: 'BRIEF_REVIEWED' }); toast('Brief marked as reviewed', { desc: 'Logged for the pilot engagement metrics.' }); }}
          >
            {reviewedToday ? `Reviewed ${fmtTime(state.briefReviewed.at)}` : 'Mark as reviewed'}
          </Button>
        </div>
      </div>

      {/* 1 · What's rising */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">1 · What's rising</h2>
          <Link to="/app/alerts" className="text-sm font-medium text-brand-600 hover:underline">All alerts →</Link>
        </div>
        {data.rising.length === 0 ? (
          <Card><EmptyState icon={CircleCheck} title="No rising risk above your thresholds" desc="Marsad will alert you as soon as a signal crosses your thresholds. You can adjust them in Settings." action={<Button onClick={() => navigate('/app/settings?tab=alerts')}>Alert thresholds</Button>} /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.rising.slice(0, 3).map((a, i) => <RisingCard key={a.id} a={a} rank={i + 1} onPlan={setPlanFor} />)}
          </div>
        )}
        {data.rising.length > 3 && <div className="mt-2 text-xs text-slate-500">+ {data.rising.length - 3} more active alert{data.rising.length - 3 > 1 ? 's' : ''} in your catchment.</div>}
      </section>

      {/* KPIs */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Expected chronic admissions · 14 d" value={Math.round(data.expected)} sub={`${Math.round(((data.expected - data.base) / data.base) * 100)}% above baseline (${Math.round(data.base)})`} icon={TrendingUp} tone="rose" onClick={() => navigate('/app/forecasts')} />
        <Stat label="Forecast peak bed occupancy" value={`${data.peakOcc}%`} sub="Across 6 wards · peak day +6" icon={BedDouble} tone={data.peakOcc >= 90 ? 'amber' : 'teal'} onClick={() => navigate('/app/readiness')} />
        <Stat label="Medicines at risk" value={data.stockRisk.length} sub={data.stockRisk.slice(0, 2).map((s) => s.name.split(' ')[0]).join(', ') || 'All covered'} icon={PackageX} tone={data.stockRisk.length ? 'amber' : 'teal'} onClick={() => navigate('/app/readiness?tab=stock')} />
        <Stat label="Open actions" value={data.openActions.length} sub={`${data.dueSoon.length} due in the next 48 h`} icon={ListChecks} tone="violet" onClick={() => navigate('/app/actions')} />
      </section>

      {/* 2 · Forecast + map */}
      <section className="mb-6 grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="2 · 14-day forecast for your catchment"
            subtitle="Daily chronic-disease admissions across partner hospitals"
            actions={<Segmented size="sm" value={cond} onChange={setCond} options={[{ value: 'all', label: 'All' }, ...CONDITIONS.map((c) => ({ value: c.id, label: c.label }))]} />}
          />
          <div className="p-5">
            <ForecastChart data={series} height={280} color={cond === 'all' ? '#179c8b' : CONDITION_MAP[cond].color} />
            <div className="mt-3"><ForecastLegend color={cond === 'all' ? '#179c8b' : CONDITION_MAP[cond].color} /></div>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Risk map" subtitle={`${cond === 'all' ? 'Highest risk across conditions' : CONDITION_MAP[cond].label} · 14 days`} actions={<Link to="/app/map"><Button size="sm" variant="ghost" iconRight={ArrowRight}>Open</Button></Link>} />
          <div className="p-4">
            <RiskMap values={mapValues} height={300} focus={data.catchment} dimNonPilot onSelect={(id) => navigate(`/app/map?district=${id}`)} markers={data.rising.slice(0, 3).map((a) => ({ id: a.id, district: a.district }))} />
            <RiskLegend className="mt-2 justify-center" />
          </div>
        </Card>
      </section>

      {/* Stressors */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Stressors this fortnight</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StressorTile icon={Thermometer} label="Heatwave" value={heatDays ? `${heatDays} days ≥ 38 °C heat index` : 'No heatwave forecast'} sub={heatDays ? 'Days +3 to +7' : 'Normal seasonal range'} hot={heatDays > 0} />
          <StressorTile icon={Zap} label="Power supply" value={`Down to ${minPower.toFixed(0)} h/day grid supply`} sub="Affects home oxygen, insulin storage" hot={minPower < 8} />
          <StressorTile icon={Wind} label="Air quality" value={dustDays ? `Dust storm · ${dustDays} days PM10 > 120` : 'Good'} sub="Generator smoke adds local load" hot={dustDays > 0} />
          <StressorTile icon={PackageSearch} label="Medicine shortages" value={`${SHORTAGES.length} items on MoPH list`} sub={SHORTAGES.filter((s) => s.severity === 'high').map((s) => s.item).join(', ')} hot />
        </div>
      </section>

      {/* 3 · Actions */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="3 · Suggested actions not yet planned" subtitle="From this morning's alerts" icon={ClipboardList} />
          <div className="divide-y divide-slate-100">
            {pending.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Every suggestion is in a plan" desc="Great — your team has acted on all suggested actions." className="py-10" />
            ) : (
              pending.map((p) => (
                <div key={p.alert.id + p.title} className="flex items-start gap-3 px-5 py-3.5">
                  <CategoryIcon id={p.category} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800">{p.title}</div>
                    <div className="text-xs text-slate-500">{p.alert.id} · {CONDITION_MAP[p.alert.condition].label}, {DISTRICT_MAP[p.alert.district].name}{p.detail ? ` · ${p.detail}` : ''}</div>
                  </div>
                  <Button size="xs" variant="subtle" onClick={() => setPlanFor(p.alert)}>Plan</Button>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Due in the next 48 hours" subtitle="Tick off as your team completes them" icon={ListChecks} actions={<Link to="/app/actions"><Button size="sm" variant="ghost" iconRight={ArrowRight}>All actions</Button></Link>} />
          <div className="divide-y divide-slate-100">
            {data.dueSoon.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Nothing due soon" className="py-10" />
            ) : (
              data.dueSoon.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <button
                    type="button"
                    aria-label="Mark done"
                    onClick={() => { dispatch({ type: 'ACTION_UPDATE', id: a.id, patch: { status: 'done' } }); toast('Action completed', { desc: a.title }); }}
                    className="text-slate-300 hover:text-teal-500"
                  >
                    <Circle className="h-5 w-5" />
                  </button>
                  <CategoryIcon id={a.category} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.alertId} · due {fmtShort(a.due)}</div>
                  </div>
                  <Avatar name={userName(a.owner)} size="xs" />
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> Based on {live} live partner feeds</span>
        <span>Last network sync {fmtTime(new Date(TODAY.getTime() + 6.5 * 3600000))}</span>
        {failing > 0 && <Link to="/app/network?status=error" className="font-medium text-amber-700 hover:underline">{failing} feed failing · confidence reduced for Aley</Link>}
        <span className="ml-auto">Model mrsd-fc 2.3 · back-test median lead time 9 days</span>
      </div>

      <ActionPlanModal alert={planFor} open={!!planFor} onClose={() => setPlanFor(null)} />
      <EmailPreview open={emailOpen} onClose={() => setEmailOpen(false)} data={data} />
      <HuddleMode open={huddle} onClose={() => setHuddle(false)} data={data} />
    </div>
  );
}
