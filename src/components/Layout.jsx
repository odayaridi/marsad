import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search, Bell, Menu, X, LogOut, ChevronDown, UserCircle2, Settings as SettingsIcon, HelpCircle, Eye, CheckCheck, BellRing, Network,
  Package, ListChecks, Sunrise, Handshake, ShieldAlert, ArrowRight, CornerDownLeft, Lock, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { NAV, ROLES, ROLE_MAP, canAccess, DISTRICT_MAP, CONDITION_MAP } from '../data/reference';
import { MY_HOSPITAL, PILOT } from '../data/seed';
import { cn, fmtRelative, TODAY } from '../lib/utils';
import { Avatar, Dropdown, MenuItem, IconButton, Button, EmptyState, Badge } from './ui';
import Icon from './Icon';
import { useToast } from './Toast';
import logoMark from '../assets/logo-mark.png';
import logoLockup from '../assets/logo-lockup.png';

const NOTIF_ICON = { alert: BellRing, brief: Sunrise, feed: Network, stock: Package, action: ListChecks, partner: Handshake };

function Sidebar({ collapsed, onNavigate, mobile }) {
  const { state, role } = useStore();
  const openAlerts = state.alerts.filter((a) => a.status === 'new').length;
  const openActions = state.actions.filter((a) => a.status !== 'done').length;
  const pilotDay = Math.min(PILOT.lengthDays, Math.round((TODAY - new Date(PILOT.startedAt)) / 86400000));
  const badges = { alerts: openAlerts, actions: openActions };
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 shrink-0 items-center border-b border-slate-100', collapsed ? 'justify-center px-2' : 'px-5')}>
        <Link to="/app" onClick={onNavigate} className="flex items-center gap-2.5">
          <img src={logoMark} alt="Marsad" className="h-9 w-9 object-contain" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[17px] font-extrabold tracking-tight text-navy-900">Marsad</div>
              <div className="text-[10.5px] font-medium text-slate-500">Chronic disease early warning</div>
            </div>
          )}
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((g) => {
          const items = g.items.filter((i) => i.roles.includes(role));
          if (!items.length) return null;
          return (
            <div key={g.group} className="mb-4">
              {!collapsed && <div className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{g.group}</div>}
              {items.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  onClick={onNavigate}
                  title={collapsed ? i.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group mb-0.5 flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition',
                      collapsed && 'justify-center',
                      isActive ? 'bg-navy-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon name={i.icon} className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-teal-300' : 'text-slate-400 group-hover:text-navy-700')} />
                      {!collapsed && <span className="flex-1 truncate">{i.label}</span>}
                      {!collapsed && i.badge && badges[i.badge] > 0 && (
                        <span className={cn('rounded-full px-1.5 py-px text-[11px] font-semibold', isActive ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600')}>{badges[i.badge]}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="m-3 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-brand-50 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-navy-800">
            <span>Mount Lebanon pilot</span>
            <span className="text-teal-700">Day {pilotDay}/{PILOT.lengthDays}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-500" style={{ width: `${(pilotDay / PILOT.lengthDays) * 100}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-slate-500">6 hospitals · 3 labs · 5 PHCs connected</div>
        </div>
      )}
      {mobile && <div className="h-2" />}
    </div>
  );
}

function NotificationsMenu() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const unread = state.notifications.filter((n) => !n.read).length;
  const [tab, setTab] = useState('all');
  const list = state.notifications.filter((n) => (tab === 'unread' ? !n.read : true)).slice(0, 12);
  return (
    <Dropdown width="w-[380px] max-w-[calc(100vw-2rem)]" trigger={<IconButton icon={Bell} label="Notifications" badge={unread || null} />}>
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-3 pb-2 pt-2">
            <div className="text-sm font-semibold text-slate-900">Notifications</div>
            <div className="flex items-center gap-1">
              {['all', 'unread'].map((t) => (
                <button type="button" key={t} onClick={() => setTab(t)} className={cn('rounded-md px-2 py-1 text-xs font-medium capitalize', tab === t ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {list.length === 0 ? (
              <EmptyState icon={CheckCheck} title="You're all caught up" desc="New alerts, feed issues and stock warnings will appear here." className="py-8" />
            ) : (
              list.map((n) => {
                const I = NOTIF_ICON[n.type] || Bell;
                return (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => {
                      dispatch({ type: 'NOTIF_READ', id: n.id });
                      close();
                      if (n.link) navigate(n.link);
                    }}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', n.type === 'alert' ? 'bg-rose-50 text-rose-600' : n.type === 'feed' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600')}>
                      <I className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-[13px] leading-snug', n.read ? 'text-slate-600' : 'font-semibold text-slate-900')}>{n.title}</div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</div>
                      <div className="mt-1 text-[11px] text-slate-400">{fmtRelative(n.at)}</div>
                    </div>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-2 pt-1.5">
            <button type="button" onClick={() => dispatch({ type: 'NOTIF_READ_ALL' })} className="rounded-md px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50">
              Mark all as read
            </button>
            <button type="button" onClick={() => { close(); navigate('/app/settings?tab=notifications'); }} className="rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100">
              Preferences
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  );
}

function RoleSwitcher() {
  const { role, dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const r = ROLE_MAP[role];
  return (
    <Dropdown
      width="w-80"
      trigger={
        <button type="button" className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs shadow-sm hover:bg-slate-50 md:flex">
          <Eye className="h-4 w-4 text-teal-600" />
          <span className="text-slate-500">Viewing as</span>
          <span className="font-semibold text-navy-900">{r.short}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      }
    >
      <div className="px-3 pb-1 pt-2 text-xs text-slate-500">Preview the system from each stakeholder's perspective. Navigation and permissions change by role.</div>
      {ROLES.map((x) => (
        <MenuItem
          key={x.id}
          active={x.id === role}
          onClick={() => {
            dispatch({ type: 'SET_ROLE', role: x.id });
            navigate(x.home);
            toast(`Now viewing as ${x.label}`, { type: 'info', desc: `${x.persona} · ${x.org}` });
          }}
        >
          <div className="font-medium">{x.label}</div>
          <div className="text-[11px] text-slate-500">{x.desc}</div>
        </MenuItem>
      ))}
    </Dropdown>
  );
}

function UserMenu() {
  const { role, auth, logout } = useStore();
  const navigate = useNavigate();
  const r = ROLE_MAP[role];
  return (
    <Dropdown
      width="w-64"
      trigger={
        <button type="button" className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100">
          <Avatar name={r.persona} size="sm" />
          <div className="hidden text-left leading-tight lg:block">
            <div className="text-[13px] font-semibold text-slate-800">{r.persona}</div>
            <div className="text-[11px] text-slate-500">{r.label}</div>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 lg:block" />
        </button>
      }
    >
      <div className="border-b border-slate-100 px-3 py-2.5">
        <div className="text-sm font-semibold text-slate-900">{r.persona}</div>
        <div className="text-xs text-slate-500">{r.org}</div>
        <div className="mt-1.5 text-[11px] text-slate-400">Signed in as <b className="text-slate-600">{auth?.username}</b></div>
      </div>
      <div className="py-1">
        <MenuItem icon={UserCircle2} onClick={() => navigate('/app/settings?tab=profile')}>My profile</MenuItem>
        <MenuItem icon={SettingsIcon} onClick={() => navigate('/app/settings')}>Settings</MenuItem>
        <MenuItem icon={HelpCircle} onClick={() => navigate('/')}>About Marsad</MenuItem>
      </div>
      <div className="border-t border-slate-100 pt-1">
        <MenuItem icon={LogOut} danger onClick={() => { logout(); navigate('/login'); }}>Sign out</MenuItem>
      </div>
    </Dropdown>
  );
}

function CommandPalette({ open, onClose }) {
  const { state, role } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (open) { setQ(''); setIdx(0); }
  }, [open]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pages = NAV.flatMap((g) => g.items.filter((i) => i.roles.includes(role)).map((i) => ({ kind: 'Page', label: i.label, sub: g.group, to: i.to, icon: i.icon })));
    const alerts = state.alerts.map((a) => ({ kind: 'Alert', label: `${a.id} · ${a.title}`, sub: `${CONDITION_MAP[a.condition].label} · ${DISTRICT_MAP[a.district].name}`, to: `/app/alerts/${a.id}`, icon: 'BellRing' }));
    const partners = state.partners.map((p) => ({ kind: 'Partner', label: p.name, sub: DISTRICT_MAP[p.district]?.name, to: `/app/network?partner=${p.id}`, icon: 'Network' }));
    const stock = state.stock.map((s) => ({ kind: 'Medicine', label: s.name, sub: 'Readiness · stock', to: '/app/readiness?tab=stock', icon: 'Pill' }));
    const districts = Object.values(DISTRICT_MAP).map((d) => ({ kind: 'District', label: d.name, sub: `${d.governorate} governorate`, to: `/app/map?district=${d.id}`, icon: 'Map' }));
    const all = [...pages, ...alerts, ...partners, ...stock, ...districts].filter((r) => canAccess(role, r.to.split('?')[0]));
    if (!t) return all.slice(0, 9);
    return all.filter((r) => (r.label + ' ' + (r.sub || '') + ' ' + r.kind).toLowerCase().includes(t)).slice(0, 12);
  }, [q, state, role]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
      if (e.key === 'Enter' && results[idx]) { navigate(results[idx].to); onClose(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, results, idx, navigate, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fadeIn bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl animate-slideUp overflow-hidden rounded-2xl bg-white shadow-pop">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} placeholder="Search pages, alerts, partners, districts, medicines…" className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate-400" />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <EmptyState icon={Search} title="No results" desc={`Nothing matches “${q}”. Try a district, condition or alert ID.`} className="py-10" />
          ) : (
            results.map((r, i) => (
              <button type="button" key={r.kind + r.label} onMouseEnter={() => setIdx(i)} onClick={() => { navigate(r.to); onClose(); }} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left', i === idx ? 'bg-brand-50' : '')}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon name={r.icon} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{r.label}</div>
                  <div className="truncate text-xs text-slate-500">{r.sub}</div>
                </div>
                <span className="text-[11px] font-medium text-slate-400">{r.kind}</span>
                {i === idx && <CornerDownLeft className="h-3.5 w-3.5 text-brand-500" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function NoAccess() {
  const { role } = useStore();
  const r = ROLE_MAP[role];
  return (
    <div className="mx-auto mt-10 max-w-lg">
      <EmptyState
        icon={Lock}
        title="This module isn't available for your role"
        desc={`${r.label} accounts can't open this page. Access is role-based and every attempt is audited. Use “Viewing as” in the top bar to switch perspective.`}
        action={<Link to={r.home}><Button variant="primary" iconRight={ArrowRight}>Go to my home page</Button></Link>}
      />
    </div>
  );
}

export default function Layout() {
  const { role, state } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('marsad.pref.sidebar') === '1'; } catch { return false; }
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try { localStorage.setItem('marsad.pref.sidebar', collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); setMobileOpen(false); }, [location.pathname]);

  const allowed = canAccess(role, location.pathname);
  const failingFeeds = state.partners.filter((p) => p.status === 'error').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-all lg:block', collapsed ? 'w-[72px]' : 'w-64')}>
        <Sidebar collapsed={collapsed} />
      </aside>
      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slideUp bg-white shadow-pop">
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cn('transition-all', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <IconButton icon={Menu} label="Open menu" className="lg:hidden" onClick={() => setMobileOpen(true)} />
          <IconButton icon={collapsed ? PanelLeftOpen : PanelLeftClose} label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden lg:inline-flex" onClick={() => setCollapsed((c) => !c)} />
          <img src={logoLockup} alt="Marsad" className="h-8 lg:hidden" />
          <button type="button" onClick={() => setPaletteOpen(true)} className="ml-1 hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white sm:flex">
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search alerts, districts, partners…</span>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-500">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <IconButton icon={Search} label="Search" className="sm:hidden" onClick={() => setPaletteOpen(true)} />
            <div className="hidden items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 xl:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {MY_HOSPITAL.name}
            </div>
            <RoleSwitcher />
            <NotificationsMenu />
            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
            <UserMenu />
          </div>
        </header>

        {failingFeeds > 0 && ['admin', 'dpo', 'lab_director'].includes(role) && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[13px] text-amber-800 sm:px-6">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span className="flex-1">{failingFeeds} partner data feed{failingFeeds > 1 ? 's are' : ' is'} failing. Forecast confidence for affected districts is reduced.</span>
            <Link to="/app/network?status=error" className="font-semibold underline-offset-2 hover:underline">Review feeds</Link>
          </div>
        )}

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{allowed ? <Outlet /> : <NoAccess />}</main>
        <footer className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 pb-6 text-[11px] text-slate-400 sm:px-6 lg:px-8">
          <span>Marsad prototype · all data is synthetic and de-identified · no real patient data</span>
          <span className="flex items-center gap-2">
            <Badge className="bg-white text-slate-500 ring-slate-200">Prototype v1.0</Badge> Experia AI Health &amp; Wellbeing Hackathon · Challenge 4
          </span>
        </footer>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
