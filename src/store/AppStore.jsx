import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  SEED_ALERTS, SEED_ACTIONS, SEED_USERS, SEED_PARTNERS, SEED_AGREEMENTS, SEED_OUTREACH, SEED_NOTIFICATIONS, SEED_AUDIT,
  SEED_WARDS, SEED_STOCK, SEED_REPORTS, SEED_ASSUMPTIONS, SEED_INTERVIEWS, SEED_LICENCES, DEFAULT_SETTINGS,
} from '../data/seed';
import { ROLE_MAP } from '../data/reference';
import { uid } from '../lib/utils';

const STORAGE_KEY = 'marsad.prototype.state.v3';
const AUTH_KEY = 'marsad.prototype.auth.v1';

function seedState() {
  return {
    viewAs: 'admin',
    alerts: SEED_ALERTS,
    actions: SEED_ACTIONS,
    users: SEED_USERS,
    partners: SEED_PARTNERS,
    agreements: SEED_AGREEMENTS,
    outreach: SEED_OUTREACH,
    notifications: SEED_NOTIFICATIONS,
    audit: SEED_AUDIT,
    wards: SEED_WARDS,
    stock: SEED_STOCK.map((s) => ({ ...s, onOrder: 0 })),
    reports: SEED_REPORTS,
    assumptions: SEED_ASSUMPTIONS,
    interviews: SEED_INTERVIEWS,
    licences: SEED_LICENCES,
    settings: DEFAULT_SETTINGS,
    briefReviewed: null,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    return { ...seedState(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) } };
  } catch {
    return seedState();
  }
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function actorFor(viewAs) {
  const r = ROLE_MAP[viewAs] || ROLE_MAP.admin;
  return { name: r.persona, role: r.id, org: r.org };
}

function audit(state, action, object, detail) {
  const a = actorFor(state.viewAs);
  const entry = { id: uid('au'), at: new Date().toISOString(), user: a.name, role: a.role, action, object, detail, ip: '10.12.4.21' };
  return { ...state, audit: [entry, ...state.audit].slice(0, 500) };
}

function notify(state, n) {
  return { ...state, notifications: [{ id: uid('n'), at: new Date().toISOString(), read: false, ...n }, ...state.notifications] };
}

const STATUS_LABEL = { new: 'New', acknowledged: 'Acknowledged', action_planned: 'Action planned', resolved: 'Resolved', dismissed: 'Dismissed' };

function reducer(state, ev) {
  const actor = actorFor(state.viewAs);
  switch (ev.type) {
    case 'SET_ROLE':
      return audit({ ...state, viewAs: ev.role }, 'SWITCH_ROLE', 'Session', `Viewing as ${ROLE_MAP[ev.role]?.label}`);

    case 'ALERT_STATUS': {
      const alerts = state.alerts.map((a) =>
        a.id === ev.id
          ? {
              ...a,
              status: ev.status,
              dismissReason: ev.status === 'dismissed' ? ev.reason : a.dismissReason,
              history: [...a.history, { at: new Date().toISOString(), by: actor.name, text: `Status → ${STATUS_LABEL[ev.status]}${ev.reason ? ` (${ev.reason})` : ''}` }],
            }
          : a,
      );
      return audit({ ...state, alerts }, 'UPDATE', `Alert ${ev.id}`, `Status → ${STATUS_LABEL[ev.status]}`);
    }

    case 'ALERT_FEEDBACK': {
      const fb = { id: uid('fb'), at: new Date().toISOString(), by: actor.name, role: actor.role, ...ev.feedback };
      const alerts = state.alerts.map((a) =>
        a.id === ev.id ? { ...a, feedback: [...a.feedback, fb], history: [...a.history, { at: fb.at, by: actor.name, text: `Feedback: trust ${fb.trust}/5${fb.understood ? ', understood why it fired' : ''}` }] } : a,
      );
      return audit({ ...state, alerts }, 'FEEDBACK', `Alert ${ev.id}`, `Trust ${fb.trust}/5 · understood: ${fb.understood ? 'yes' : 'no'} · action: ${fb.action ? 'yes' : 'no'}`);
    }

    case 'ALERT_COMMENT': {
      const alerts = state.alerts.map((a) => (a.id === ev.id ? { ...a, history: [...a.history, { at: new Date().toISOString(), by: actor.name, text: ev.text, comment: true }] } : a));
      return { ...state, alerts };
    }

    case 'ACTIONS_ADD': {
      const created = ev.actions.map((x) => ({ id: `ACT-${Math.floor(400 + Math.random() * 9000)}`, status: 'todo', createdAt: new Date().toISOString(), ...x }));
      let next = { ...state, actions: [...created, ...state.actions] };
      if (ev.alertId) {
        next.alerts = next.alerts.map((a) =>
          a.id === ev.alertId && ['new', 'acknowledged'].includes(a.status)
            ? { ...a, status: 'action_planned', history: [...a.history, { at: new Date().toISOString(), by: actor.name, text: `Action plan created (${created.length} actions)` }] }
            : a,
        );
      }
      next = audit(next, 'CREATE', ev.alertId ? `Action plan ${ev.alertId}` : 'Action', `${created.length} action(s) created`);
      return next;
    }

    case 'ACTION_UPDATE': {
      const actions = state.actions.map((a) =>
        a.id === ev.id ? { ...a, ...ev.patch, completedAt: ev.patch.status === 'done' ? new Date().toISOString() : ev.patch.status ? null : a.completedAt } : a,
      );
      const detail = Object.entries(ev.patch).map(([k, v]) => `${k} → ${v}`).join(', ');
      return audit({ ...state, actions }, 'UPDATE', `Action ${ev.id}`, detail);
    }

    case 'ACTION_DELETE':
      return audit({ ...state, actions: state.actions.filter((a) => a.id !== ev.id) }, 'DELETE', `Action ${ev.id}`, 'Removed from plan');

    case 'NOTIF_READ':
      return { ...state, notifications: state.notifications.map((n) => (n.id === ev.id ? { ...n, read: true } : n)) };
    case 'NOTIF_READ_ALL':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'NOTIF_CLEAR':
      return { ...state, notifications: state.notifications.filter((n) => !n.read) };

    case 'USER_ADD': {
      const u = { id: uid('u'), status: 'invited', lastActive: null, mfa: false, ...ev.user };
      return audit({ ...state, users: [u, ...state.users] }, 'INVITE', `User ${u.email}`, `Role: ${ROLE_MAP[u.role]?.label}`);
    }
    case 'USER_UPDATE': {
      const users = state.users.map((u) => (u.id === ev.id ? { ...u, ...ev.patch } : u));
      const u = users.find((x) => x.id === ev.id);
      return audit({ ...state, users }, 'PERMISSION', `User ${u?.email}`, Object.entries(ev.patch).map(([k, v]) => `${k} → ${v}`).join(', '));
    }

    case 'PARTNER_ADD': {
      const p = { id: uid('p'), status: 'onboarding', lastSync: null, records30: 0, quality: null, joined: new Date().toISOString(), agreement: 'draft', ...ev.partner };
      const ag = { id: `AG-${Math.floor(10 + Math.random() * 89)}`, partnerId: p.id, stage: 'draft', updated: new Date().toISOString(), owner: actor.name, next: 'Send LOI for signature', docs: [] };
      let next = { ...state, partners: [...state.partners, p], agreements: [ag, ...state.agreements] };
      next = notify(next, { type: 'partner', title: `Invitation sent to ${p.name}`, body: 'Agreement created in Draft stage.', link: '/app/network' });
      return audit(next, 'INVITE', `Partner ${p.name}`, `Fields: ${p.fields.join(', ') || 'none'}`);
    }
    case 'PARTNER_UPDATE': {
      const partners = state.partners.map((p) => (p.id === ev.id ? { ...p, ...ev.patch } : p));
      const p = partners.find((x) => x.id === ev.id);
      return audit({ ...state, partners }, ev.auditAction || 'UPDATE', `Partner ${p?.name}`, ev.auditDetail || Object.keys(ev.patch).join(', '));
    }
    case 'AGREEMENT_UPDATE': {
      const agreements = state.agreements.map((a) => (a.id === ev.id ? { ...a, ...ev.patch, updated: new Date().toISOString() } : a));
      let partners = state.partners;
      const ag = agreements.find((a) => a.id === ev.id);
      if (ag?.partnerId && ev.patch.stage) {
        partners = partners.map((p) => (p.id === ag.partnerId ? { ...p, agreement: ev.patch.stage, ...(ev.patch.stage === 'live' && p.status === 'onboarding' ? { status: 'live', lastSync: new Date().toISOString(), quality: 82 } : {}) } : p));
      }
      return audit({ ...state, agreements, partners }, 'APPROVE', `Agreement ${ev.id}`, `Stage → ${ev.patch.stage}`);
    }

    case 'OUTREACH_UPDATE': {
      const outreach = state.outreach.map((o) =>
        o.id === ev.id ? { ...o, ...ev.patch, attempts: ev.patch.status && ev.patch.status !== 'pending' ? o.attempts + 1 : o.attempts, lastAttempt: ev.patch.status ? new Date().toISOString() : o.lastAttempt } : o,
      );
      const o = outreach.find((x) => x.id === ev.id);
      return audit({ ...state, outreach }, 'UPDATE', `Outreach ${o?.pid}`, `Call outcome → ${ev.patch.status || 'note'}`);
    }

    case 'WARD_RESERVE': {
      const wards = state.wards.map((w) => (w.id === ev.id ? { ...w, reserved: Math.max(0, ev.reserved) } : w));
      const w = wards.find((x) => x.id === ev.id);
      return audit({ ...state, wards }, 'UPDATE', `Ward ${w?.name}`, `Reserved beds → ${ev.reserved}`);
    }

    case 'STOCK_ORDER': {
      const stock = state.stock.map((s) => (s.id === ev.id ? { ...s, onOrder: (s.onOrder || 0) + ev.qty, lastOrder: new Date().toISOString() } : s));
      const s = stock.find((x) => x.id === ev.id);
      let next = notify({ ...state, stock }, { type: 'stock', title: `Order placed: ${ev.qty} ${s?.unit} of ${s?.name}`, body: `Expected in ${s?.leadTimeDays} days from ${s?.supplier}.`, link: '/app/readiness', read: true });
      return audit(next, 'CREATE', `Purchase order · ${s?.name}`, `${ev.qty} ${s?.unit}`);
    }

    case 'SETTINGS_UPDATE':
      return audit({ ...state, settings: { ...state.settings, ...ev.patch } }, 'UPDATE', ev.section || 'Settings', Object.keys(ev.patch).join(', '));

    case 'REPORT_ADD': {
      const r = { id: `R-${Math.floor(100 + Math.random() * 900)}`, created: new Date().toISOString(), status: 'draft', ...ev.report };
      return audit({ ...state, reports: [r, ...state.reports] }, 'GENERATE', `Report ${r.title}`, r.period);
    }
    case 'REPORT_UPDATE': {
      const reports = state.reports.map((r) => (r.id === ev.id ? { ...r, ...ev.patch } : r));
      return audit({ ...state, reports }, ev.auditAction || 'UPDATE', `Report ${ev.id}`, Object.entries(ev.patch).map(([k, v]) => `${k} → ${Array.isArray(v) ? v.join(', ') : v}`).join('; '));
    }

    case 'ASSUMPTION_UPDATE':
      return { ...state, assumptions: state.assumptions.map((a) => (a.id === ev.id ? { ...a, ...ev.patch } : a)) };
    case 'INTERVIEW_UPDATE':
      return { ...state, interviews: state.interviews.map((a) => (a.id === ev.id ? { ...a, ...ev.patch } : a)) };
    case 'LICENCE_UPDATE':
      return audit({ ...state, licences: state.licences.map((a) => (a.id === ev.id ? { ...a, ...ev.patch } : a)) }, 'UPDATE', `Licence ${ev.id}`, Object.values(ev.patch).join(', '));

    case 'BRIEF_REVIEWED':
      return audit({ ...state, briefReviewed: { date: new Date().toDateString(), at: new Date().toISOString(), by: actor.name } }, 'REVIEW', 'Morning brief', 'Marked as reviewed');

    case 'AUDIT':
      return audit(state, ev.action, ev.object, ev.detail);

    case 'RESET':
      return { ...seedState(), viewAs: state.viewAs };

    default:
      return state;
  }
}

function authReducer(state, ev) {
  switch (ev.type) {
    case 'LOGIN':
      return { username: ev.username, at: new Date().toISOString() };
    case 'LOGOUT':
      return null;
    default:
      return state;
  }
}

const StoreCtx = createContext(null);

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [auth, authDispatch] = useReducer(authReducer, undefined, loadAuth);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — prototype keeps working in memory */
    }
  }, [state]);

  useEffect(() => {
    try {
      if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
      else localStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
  }, [auth]);

  const value = useMemo(() => {
    const role = state.viewAs;
    return {
      state,
      dispatch,
      auth,
      role,
      actor: actorFor(role),
      login: (username) => {
        authDispatch({ type: 'LOGIN', username });
        dispatch({ type: 'AUDIT', action: 'LOGIN', object: 'Session', detail: `User ${username} signed in` });
      },
      logout: () => {
        dispatch({ type: 'AUDIT', action: 'LOGOUT', object: 'Session', detail: 'Signed out' });
        authDispatch({ type: 'LOGOUT' });
      },
    };
  }, [state, auth]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}
