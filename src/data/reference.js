// Reference / lookup data for the Marsad prototype.
import { DISTRICT_SHAPES } from './lebanonMap';

export const CONDITIONS = [
  { id: 'diabetes', label: 'Diabetes', long: 'Diabetic emergencies (DKA, HHS, hypo/hyperglycaemia)', color: '#1f6fbe', soft: '#e3eefa', icon: 'Droplet' },
  { id: 'cardiac', label: 'Cardiac', long: 'Cardiac decompensation (heart failure, ACS, hypertensive crisis)', color: '#d6455d', soft: '#fbe7ea', icon: 'HeartPulse' },
  { id: 'respiratory', label: 'Respiratory', long: 'Respiratory exacerbations (COPD, asthma)', color: '#179c8b', soft: '#e1f5f1', icon: 'Wind' },
];
export const CONDITION_MAP = Object.fromEntries(CONDITIONS.map((c) => [c.id, c]));

export const AGE_GROUPS = [
  { id: '0-17', label: '0–17' },
  { id: '18-44', label: '18–44' },
  { id: '45-64', label: '45–64' },
  { id: '65+', label: '65+' },
];

// Approximate populations (thousands) — illustrative only
const POP = {
  beirut: 430, baabda: 520, matn: 480, aley: 260, chouf: 240, keserwan: 230, jbeil: 130, batroun: 85, koura: 80, tripoli: 450,
  zgharta: 90, bsharri: 30, minieh: 160, akkar: 400, hermel: 75, baalbek: 330, zahle: 260, westbekaa: 120, rashaya: 45, jezzine: 50,
  saida: 300, tyre: 330, nabatieh: 210, marjayoun: 90, hasbaya: 40, bintjbeil: 140,
};

export const PILOT_DISTRICTS = ['baabda', 'matn', 'aley', 'chouf', 'keserwan', 'jbeil', 'beirut'];

export const DISTRICTS = DISTRICT_SHAPES.map((d) => ({
  id: d.id,
  name: d.name,
  governorate: d.governorate,
  population: POP[d.id] * 1000,
  pilot: PILOT_DISTRICTS.includes(d.id),
}));
export const DISTRICT_MAP = Object.fromEntries(DISTRICTS.map((d) => [d.id, d]));

export const SEVERITY = {
  high: { label: 'High', cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500', rank: 3 },
  medium: { label: 'Medium', cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500', rank: 2 },
  low: { label: 'Low', cls: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500', rank: 1 },
};

export const ALERT_STATUS = {
  new: { label: 'New', cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  acknowledged: { label: 'Acknowledged', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  action_planned: { label: 'Action planned', cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  resolved: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  dismissed: { label: 'Dismissed', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

export const ACTION_STATUS = {
  todo: { label: 'To do', cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  in_progress: { label: 'In progress', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  done: { label: 'Done', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

export const ACTION_CATEGORIES = [
  { id: 'beds', label: 'Beds', icon: 'BedDouble', color: '#1f6fbe' },
  { id: 'medicines', label: 'Medicines', icon: 'Pill', color: '#7c3aed' },
  { id: 'outreach', label: 'PHC outreach', icon: 'PhoneCall', color: '#179c8b' },
  { id: 'staff', label: 'Staff & rota', icon: 'Users', color: '#d97706' },
  { id: 'comms', label: 'Communication', icon: 'Megaphone', color: '#64748b' },
];
export const ACTION_CATEGORY_MAP = Object.fromEntries(ACTION_CATEGORIES.map((c) => [c.id, c]));

export const PARTNER_TYPES = {
  hospital: { label: 'Hospital', icon: 'Building2', color: '#1f6fbe' },
  lab: { label: 'Laboratory', icon: 'FlaskConical', color: '#7c3aed' },
  phc: { label: 'PHC centre', icon: 'Stethoscope', color: '#179c8b' },
  pharmacy: { label: 'Pharmacy network', icon: 'Pill', color: '#d97706' },
  ngo: { label: 'NGO', icon: 'HandHeart', color: '#db2777' },
  public: { label: 'Public data', icon: 'CloudSun', color: '#0891b2' },
};

export const FEED_STATUS = {
  live: { label: 'Live', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  delayed: { label: 'Delayed', cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  error: { label: 'Sync error', cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  onboarding: { label: 'Onboarding', cls: 'bg-brand-50 text-brand-700 ring-brand-200', dot: 'bg-brand-500' },
  paused: { label: 'Paused', cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
};

export const AGREEMENT_STAGES = [
  { id: 'draft', label: 'Draft' },
  { id: 'loi', label: 'LOI signed' },
  { id: 'dsa', label: 'DSA signed' },
  { id: 'live', label: 'Live' },
];

export const DATA_FIELDS = [
  { id: 'lab_results', label: 'Lab results (HbA1c, glucose, NT-proBNP, troponin, eosinophils)', group: 'Clinical' },
  { id: 'admissions', label: 'Admissions & ER visits (diagnosis group, age band)', group: 'Clinical' },
  { id: 'refills', label: 'Prescription refills (insulin, diuretics, inhalers)', group: 'Pharmacy' },
  { id: 'missed_visits', label: 'Missed follow-up visits', group: 'Primary care' },
  { id: 'stock', label: 'Medicine stock levels', group: 'Operations' },
  { id: 'beds', label: 'Bed occupancy', group: 'Operations' },
];

// Roles and what they can see. "admin" can view as any role.
export const ROLES = [
  { id: 'director', label: 'Medical Director', short: 'Director', persona: 'Dr. Rania Khoury', org: 'Al-Arz Medical Center · Baabda', home: '/app/brief', desc: 'Primary user. Morning brief, alerts, action plans, readiness.' },
  { id: 'er_head', label: 'ER / Internal Medicine Head', short: 'ER Head', persona: 'Dr. Karim Haddad', org: 'Al-Arz Medical Center · Baabda', home: '/app/brief', desc: 'Expected ER load, bed reservations, staffing.' },
  { id: 'lab_director', label: 'Laboratory Director', short: 'Lab Director', persona: 'Dr. Maya Saliba', org: 'Levant Diagnostics Network', home: '/app/benchmarks', desc: 'Data contribution status and free benchmarks.' },
  { id: 'phc', label: 'PHC Coordinator', short: 'PHC', persona: 'Nadine Farah', org: 'Hadath Primary Health Centre', home: '/app/outreach', desc: 'Outreach call lists for high-risk patients.' },
  { id: 'moph', label: 'MoPH Analyst', short: 'MoPH', persona: 'Elie Mansour', org: 'Ministry of Public Health · Epidemiological Surveillance', home: '/app/national', desc: 'District-level national view, licences, reports.' },
  { id: 'dpo', label: 'CIO / Data-Protection Officer', short: 'DPO', persona: 'Rami Aoun', org: 'Al-Arz Medical Center · IT', home: '/app/governance', desc: 'Permissions, anonymisation, audit trail, agreements.' },
  { id: 'board', label: 'CEO / Board Member', short: 'Board', persona: 'Georges Khalil', org: 'Al-Arz Medical Center · Board', home: '/app/reports', desc: 'Impact reports and subscription.' },
  { id: 'admin', label: 'System Administrator', short: 'Admin', persona: 'Marsad Admin', org: 'Marsad Platform', home: '/app/brief', desc: 'Full access to every module.' },
];
export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r]));

// Navigation + permissions matrix
export const NAV = [
  { group: 'Overview', items: [
    { to: '/app/brief', label: 'Morning Brief', icon: 'Sunrise', roles: ['director', 'er_head', 'admin', 'moph', 'board'] },
    { to: '/app/national', label: 'National Overview', icon: 'Landmark', roles: ['moph', 'admin', 'board'] },
  ] },
  { group: 'Detect', items: [
    { to: '/app/alerts', label: 'Alerts', icon: 'BellRing', roles: ['director', 'er_head', 'moph', 'admin', 'phc', 'lab_director'], badge: 'alerts' },
    { to: '/app/map', label: 'Risk Map', icon: 'Map', roles: ['director', 'er_head', 'moph', 'admin', 'phc', 'lab_director', 'board'] },
    { to: '/app/forecasts', label: 'Forecasts', icon: 'TrendingUp', roles: ['director', 'er_head', 'moph', 'admin'] },
    { to: '/app/signals', label: 'Early Signals', icon: 'Activity', roles: ['director', 'er_head', 'moph', 'admin', 'lab_director'] },
  ] },
  { group: 'Act', items: [
    { to: '/app/actions', label: 'Action Plans', icon: 'ListChecks', roles: ['director', 'er_head', 'admin', 'phc'], badge: 'actions' },
    { to: '/app/readiness', label: 'Readiness', icon: 'BedDouble', roles: ['director', 'er_head', 'admin'] },
    { to: '/app/outreach', label: 'PHC Outreach', icon: 'PhoneCall', roles: ['director', 'phc', 'admin'] },
  ] },
  { group: 'Connect', items: [
    { to: '/app/network', label: 'Data Network', icon: 'Network', roles: ['director', 'dpo', 'admin', 'lab_director', 'moph'] },
    { to: '/app/benchmarks', label: 'Benchmarks', icon: 'BarChart3', roles: ['lab_director', 'phc', 'admin', 'director'] },
  ] },
  { group: 'Govern', items: [
    { to: '/app/governance', label: 'Privacy & Audit', icon: 'ShieldCheck', roles: ['dpo', 'admin', 'director'] },
    { to: '/app/reports', label: 'Impact Reports', icon: 'FileBarChart', roles: ['director', 'board', 'moph', 'admin'] },
  ] },
  { group: 'Administration', items: [
    { to: '/app/pilot', label: 'Pilot Program', icon: 'FlaskRound', roles: ['admin', 'director', 'board'] },
    { to: '/app/subscription', label: 'Subscription', icon: 'CreditCard', roles: ['admin', 'board', 'director'] },
    { to: '/app/users', label: 'Users & Roles', icon: 'UserCog', roles: ['admin', 'dpo'] },
    { to: '/app/settings', label: 'Settings', icon: 'Settings', roles: ['admin', 'director', 'er_head', 'lab_director', 'phc', 'moph', 'dpo', 'board'] },
  ] },
];

export function canAccess(role, path) {
  for (const g of NAV) for (const i of g.items) if (path.startsWith(i.to)) return i.roles.includes(role);
  return true;
}

export const PRICING_TIERS = [
  { id: 'small', label: 'Under 100 beds', price: 4800, beds: '< 100' },
  { id: 'medium', label: '100–250 beds', price: 9600, beds: '100–250' },
  { id: 'large', label: 'Over 250 beds', price: 18000, beds: '> 250' },
];

export const DISTRICT_LICENCE_PRICE = 40000;
