// Synthetic, de-identified demo data for the Marsad prototype.
// Everything here is illustrative. No real patient or institution data.
import { TODAY, addDays, addMinutes, iso, mulberry32, hashStr, clamp } from '../lib/utils';
import { DISTRICTS, CONDITIONS } from './reference';

const d = (n) => iso(addDays(TODAY, n));
const at = (dayOffset, hh, mm = 0) => {
  const x = addDays(TODAY, dayOffset);
  x.setHours(hh, mm, 0, 0);
  return iso(x);
};

/* ------------------------------------------------------------------ */
/* Organisation context                                                 */
/* ------------------------------------------------------------------ */
export const MY_HOSPITAL = {
  id: 'h-alarz',
  name: 'Al-Arz Medical Center',
  district: 'baabda',
  beds: 220,
  type: 'Private',
  catchment: ['baabda', 'aley', 'matn', 'chouf'],
};

export const PILOT = {
  startedAt: d(-41),
  lengthDays: 90,
  region: 'Mount Lebanon',
};

/* ------------------------------------------------------------------ */
/* Alerts (Detect)                                                      */
/* ------------------------------------------------------------------ */
const SIG = {
  hba1c: (w, district, change) => ({ key: 'hba1c', label: 'Rising HbA1c at partner labs', weight: w, source: 'Levant Diagnostics · Cedar Clinical Labs', type: 'lab', detail: `Share of HbA1c results ≥ 9% in ${district} rose from 21% to ${21 + change}% over 4 weeks (n = 1,284 tests).`, unit: '% ≥ 9%', trend: trend(21, 21 + change, 'hb' + district) }),
  insulin: (w, district, change) => ({ key: 'insulin_refills', label: 'Missed insulin refills', weight: w, source: 'Pharmacy refill network (42 pharmacies)', type: 'refill', detail: `Insulin refills overdue > 7 days up ${change}% vs. 8-week baseline in ${district}.`, unit: '% overdue', trend: trend(11, 11 + change / 3, 'in' + district) }),
  heat: (w, days) => ({ key: 'heatwave', label: 'Heatwave forecast', weight: w, source: 'Lebanese Meteorological Department (public feed)', type: 'stressor', detail: `Heat index ≥ 38 °C forecast for ${days} consecutive days; dehydration raises hyperglycaemia and decompensation risk.`, unit: '°C heat index', trend: trend(31, 39, 'heat' + days) }),
  seasonal: (w) => ({ key: 'seasonal', label: 'Seasonal baseline', weight: w, source: 'Network admissions history (3 years)', type: 'baseline', detail: 'Same period in previous years shows a modest seasonal rise.', unit: 'adm/day', trend: trend(6, 7, 'seas' + w) }),
  bnp: (w, district, change) => ({ key: 'bnp', label: 'Elevated NT-proBNP results', weight: w, source: 'Levant Diagnostics · MedLab Mount Lebanon', type: 'lab', detail: `NT-proBNP > 900 pg/mL in patients 65+ in ${district} up ${change}% in 3 weeks.`, unit: '% elevated', trend: trend(14, 14 + change / 2, 'bnp' + district) }),
  diuretic: (w, district, change) => ({ key: 'diuretic_refills', label: 'Missed diuretic & antihypertensive refills', weight: w, source: 'Pharmacy refill network', type: 'refill', detail: `Furosemide / ACE-inhibitor refills overdue up ${change}% in ${district}; two local stock-outs reported.`, unit: '% overdue', trend: trend(9, 9 + change / 3, 'diu' + district) }),
  power: (w, hours) => ({ key: 'power_cuts', label: 'Extended power cuts', weight: w, source: 'EDL supply schedule + generator reports', type: 'stressor', detail: `Grid supply down to ~${hours} h/day; home oxygen concentrators, fans and insulin refrigeration affected.`, unit: 'h supply/day', trend: trend(10, hours, 'pw' + hours) }),
  inhaler: (w) => ({ key: 'inhaler_shortage', label: 'Salbutamol inhaler shortage', weight: w, source: 'MoPH shortage list + pharmacy stock feed', type: 'stressor', detail: '31% of network pharmacies report salbutamol inhalers out of stock for > 5 days.', unit: '% pharmacies out', trend: trend(6, 31, 'inh') }),
  resp_visits: (w, district, change) => ({ key: 'resp_visits', label: 'Rising wheeze / COPD visits at PHCs', weight: w, source: 'PHC visit logs (6 centres)', type: 'phc', detail: `Respiratory exacerbation visits at ${district} PHCs up ${change}% week-on-week.`, unit: 'visits/week', trend: trend(38, 38 * (1 + change / 100), 'rv' + district) }),
  dust: (w) => ({ key: 'dust', label: 'Dust storm & poor air quality', weight: w, source: 'Air-quality monitors (public feed)', type: 'stressor', detail: 'PM10 forecast > 150 µg/m³ for 3 days; generator smoke adds local PM2.5 load.', unit: 'PM10 µg/m³', trend: trend(45, 160, 'dust') }),
  missed_visits: (w, district, change) => ({ key: 'missed_visits', label: 'Missed PHC follow-up visits', weight: w, source: 'PHC appointment records', type: 'phc', detail: `No-show rate for chronic-care visits in ${district} up ${change}% (transport costs, fuel prices).`, unit: '% no-show', trend: trend(17, 17 + change / 3, 'mv' + district) }),
};

function trend(from, to, seed) {
  const r = mulberry32(hashStr(seed));
  const n = 12;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const ease = t * t * (3 - 2 * t);
    return +(from + (to - from) * ease + (r() - 0.5) * Math.abs(to - from) * 0.18).toFixed(1);
  });
}

function mkAlert(o) {
  const severity = o.rise >= 30 ? 'high' : o.rise >= 15 ? 'medium' : 'low';
  return {
    severity,
    feedback: [],
    history: [{ at: o.createdAt, by: 'Marsad engine', text: `Alert generated by forecasting model ${o.model?.version || 'mrsd-fc 2.3'}` }],
    model: { version: 'mrsd-fc 2.3', backtestMape: 0.14, medianLeadDays: 9, trainedOn: '3 yrs network admissions · 6 hospitals', ...(o.model || {}) },
    ...o,
  };
}

export const SEED_ALERTS = [
  mkAlert({
    id: 'A-1042', condition: 'diabetes', district: 'baabda', ageGroups: ['45-64', '65+'], rise: 38, horizonDays: 10,
    windowStart: d(3), windowEnd: d(10), confidence: 0.82, status: 'new', createdAt: at(0, 5, 12),
    baseline: 6.1, expected: 8.4,
    title: 'Diabetes emergencies likely ↑ in Baabda over 10 days',
    summary: 'Rising HbA1c at partner labs, missed insulin refills and a heatwave point to more diabetic emergencies among adults 45+.',
    signals: [SIG.hba1c(42, 'Baabda', 9), SIG.insulin(31, 'Baabda', 24), SIG.heat(19, 4), SIG.seasonal(8)],
    stressors: ['heatwave', 'power_cuts'],
    suggested: [
      { category: 'beds', title: 'Reserve 4 internal-medicine beds for diabetic admissions', detail: 'Expected +2.3 admissions/day at peak (days 5–8).' },
      { category: 'medicines', title: 'Check insulin stock and IV-fluid cover for 14 days', detail: 'Insulin glargine cover is 9 days at projected demand.' },
      { category: 'outreach', title: 'Ask Hadath & Chiyah PHCs to call high-risk diabetic patients', detail: '86 de-identified patients with ≥ 2 missed refills and HbA1c ≥ 10%.' },
      { category: 'staff', title: 'Add one ER nurse to evening shifts on peak days', detail: 'Peak arrivals forecast 16:00–22:00.' },
    ],
  }),
  mkAlert({
    id: 'A-1041', condition: 'cardiac', district: 'matn', ageGroups: ['65+'], rise: 27, horizonDays: 12,
    windowStart: d(4), windowEnd: d(12), confidence: 0.74, status: 'acknowledged', createdAt: at(-1, 5, 8),
    baseline: 7.8, expected: 9.9,
    title: 'Heart-failure decompensation likely ↑ in Matn over 12 days',
    summary: 'Elevated NT-proBNP results and missed diuretic refills among patients 65+, amplified by heat and power cuts.',
    signals: [SIG.bnp(36, 'Matn', 22), SIG.diuretic(28, 'Matn', 19), SIG.heat(22, 4), SIG.power(14, 6)],
    stressors: ['heatwave', 'power_cuts', 'shortage'],
    suggested: [
      { category: 'beds', title: 'Hold 2 cardiology step-down beds from day 6', detail: 'CCU occupancy forecast at 92% on day 8.' },
      { category: 'medicines', title: 'Secure 14-day IV furosemide cover', detail: 'Two pharmacy stock-outs reported in the district.' },
      { category: 'outreach', title: 'PHC calls to 65+ patients with missed diuretic refills', detail: '54 patients flagged.' },
    ],
  }),
  mkAlert({
    id: 'A-1040', condition: 'respiratory', district: 'chouf', ageGroups: ['65+', '0-17'], rise: 33, horizonDays: 9,
    windowStart: d(2), windowEnd: d(9), confidence: 0.79, status: 'action_planned', createdAt: at(-2, 5, 20),
    baseline: 4.6, expected: 6.1,
    title: 'COPD & asthma exacerbations likely ↑ in Chouf over 9 days',
    summary: 'Dust storm, generator smoke and a salbutamol shortage, with PHC respiratory visits already rising.',
    signals: [SIG.dust(34), SIG.inhaler(26), SIG.resp_visits(22, 'Chouf', 28), SIG.power(18, 5)],
    stressors: ['dust', 'power_cuts', 'shortage'],
    suggested: [
      { category: 'medicines', title: 'Order salbutamol & ipratropium nebules (2 weeks cover)', detail: 'Inhaler shortage across 31% of pharmacies.' },
      { category: 'beds', title: 'Prepare 3 pulmonary beds with oxygen', detail: 'Peak expected on days 4–6.' },
      { category: 'outreach', title: 'Advise COPD patients via PHCs to stay indoors on dust days', detail: '112 patients on PHC registers.' },
      { category: 'comms', title: 'Share air-quality advisory with partner PHCs', detail: 'Template advisory ready.' },
    ],
  }),
  mkAlert({
    id: 'A-1039', condition: 'diabetes', district: 'aley', ageGroups: ['45-64'], rise: 18, horizonDays: 14,
    windowStart: d(6), windowEnd: d(14), confidence: 0.66, status: 'new', createdAt: at(0, 5, 14),
    baseline: 3.2, expected: 3.8,
    title: 'Diabetes emergencies may ↑ in Aley over 14 days',
    summary: 'Missed PHC follow-ups and rising HbA1c in adults 45–64; moderate confidence.',
    signals: [SIG.missed_visits(38, 'Aley', 21), SIG.hba1c(34, 'Aley', 5), SIG.heat(18, 3), SIG.seasonal(10)],
    stressors: ['heatwave'],
    suggested: [
      { category: 'outreach', title: 'Re-book missed chronic-care visits at Choueifat PHC', detail: '41 patients missed ≥ 1 visit.' },
      { category: 'medicines', title: 'Confirm metformin and test-strip availability', detail: 'Cover adequate; monitor.' },
    ],
  }),
  mkAlert({
    id: 'A-1038', condition: 'cardiac', district: 'baabda', ageGroups: ['65+'], rise: 31, horizonDays: 11,
    windowStart: d(4), windowEnd: d(11), confidence: 0.71, status: 'new', createdAt: at(0, 5, 10),
    baseline: 8.6, expected: 11.3,
    title: 'Cardiac admissions likely ↑ in Baabda over 11 days',
    summary: 'Heatwave plus missed antihypertensive refills among older adults; NT-proBNP trending up.',
    signals: [SIG.heat(33, 4), SIG.diuretic(29, 'Baabda', 17), SIG.bnp(27, 'Baabda', 14), SIG.seasonal(11)],
    stressors: ['heatwave', 'power_cuts'],
    suggested: [
      { category: 'beds', title: 'Reserve 2 CCU beds and 3 telemetry beds', detail: 'Peak expected days 6–9.' },
      { category: 'staff', title: 'Confirm on-call cardiologist cover for weekend', detail: 'Weekend overlaps peak.' },
      { category: 'outreach', title: 'Heat-safety calls to 65+ cardiac patients', detail: '73 patients flagged by PHCs.' },
    ],
  }),
  mkAlert({
    id: 'A-1037', condition: 'respiratory', district: 'keserwan', ageGroups: ['0-17'], rise: 12, horizonDays: 14,
    windowStart: d(7), windowEnd: d(14), confidence: 0.58, status: 'acknowledged', createdAt: at(-1, 5, 30),
    baseline: 3.9, expected: 4.4,
    title: 'Paediatric asthma visits may ↑ in Keserwan',
    summary: 'Small rise in paediatric wheeze visits; low severity, watch only.',
    signals: [SIG.resp_visits(46, 'Keserwan', 11), SIG.dust(30), SIG.seasonal(24)],
    stressors: ['dust'],
    suggested: [{ category: 'comms', title: 'Inform paediatric ER of possible small rise', detail: 'No bed changes needed.' }],
  }),
  mkAlert({
    id: 'A-1036', condition: 'diabetes', district: 'matn', ageGroups: ['65+'], rise: 24, horizonDays: 10,
    windowStart: d(1), windowEnd: d(8), confidence: 0.77, status: 'action_planned', createdAt: at(-4, 5, 2),
    baseline: 5.4, expected: 6.7,
    title: 'Diabetes emergencies likely ↑ in Matn among 65+',
    summary: 'Insulin refills delayed after a supply interruption; HbA1c rising.',
    signals: [SIG.insulin(44, 'Matn', 29), SIG.hba1c(31, 'Matn', 6), SIG.power(15, 7), SIG.seasonal(10)],
    stressors: ['power_cuts', 'shortage'],
    suggested: [
      { category: 'medicines', title: 'Coordinate insulin bridging supply with partner pharmacies', detail: 'Supply interruption since last week.' },
      { category: 'outreach', title: 'PHC calls to insulin-dependent 65+ patients', detail: '62 patients flagged.' },
    ],
  }),
  mkAlert({
    id: 'A-1035', condition: 'cardiac', district: 'jbeil', ageGroups: ['65+'], rise: 16, horizonDays: 12,
    windowStart: d(-10), windowEnd: d(-2), confidence: 0.69, status: 'resolved', createdAt: at(-14, 5, 0),
    baseline: 2.8, expected: 3.3,
    title: 'Cardiac admissions ↑ in Jbeil (resolved)',
    summary: 'Forecast rise materialised at +14%; beds were pre-reserved.',
    signals: [SIG.heat(40, 3), SIG.diuretic(35, 'Jbeil', 12), SIG.seasonal(25)],
    stressors: ['heatwave'],
    suggested: [{ category: 'beds', title: 'Reserve 2 telemetry beds', detail: '' }],
    outcome: { observedRise: 14, leadDays: 9, note: 'Peak arrived on day 8. No ER boarding over 4 h.' },
  }),
  mkAlert({
    id: 'A-1034', condition: 'respiratory', district: 'beirut', ageGroups: ['18-44', '45-64'], rise: 21, horizonDays: 10,
    windowStart: d(-8), windowEnd: d(-1), confidence: 0.61, status: 'dismissed', createdAt: at(-11, 5, 0),
    baseline: 9.2, expected: 11.1,
    title: 'Respiratory visits ↑ in Beirut (dismissed)',
    summary: 'Signal driven by an infectious cluster already covered by national surveillance.',
    signals: [SIG.resp_visits(52, 'Beirut', 19), SIG.dust(28), SIG.seasonal(20)],
    stressors: ['dust'],
    suggested: [],
    dismissReason: 'Duplicate of an infectious-disease signal already covered by national surveillance.',
  }),
  mkAlert({
    id: 'A-1033', condition: 'diabetes', district: 'chouf', ageGroups: ['45-64', '65+'], rise: 29, horizonDays: 10,
    windowStart: d(-20), windowEnd: d(-12), confidence: 0.8, status: 'resolved', createdAt: at(-24, 5, 0),
    baseline: 3.1, expected: 4.0,
    title: 'Diabetes emergencies ↑ in Chouf (resolved)',
    summary: 'PHC outreach reached 71% of flagged patients; observed rise +17% vs +29% forecast.',
    signals: [SIG.insulin(45, 'Chouf', 26), SIG.hba1c(35, 'Chouf', 7), SIG.seasonal(20)],
    stressors: ['shortage'],
    suggested: [],
    outcome: { observedRise: 17, leadDays: 11, note: 'Outreach likely averted ~9 admissions (estimate).' },
  }),
  // National-scope alerts (outside the pilot catchment, visible to MoPH)
  mkAlert({
    id: 'A-1043', condition: 'diabetes', district: 'tripoli', ageGroups: ['45-64', '65+'], rise: 22, horizonDays: 12,
    windowStart: d(5), windowEnd: d(12), confidence: 0.62, status: 'new', createdAt: at(0, 5, 18),
    baseline: 7.4, expected: 9.0,
    title: 'Diabetes emergencies may ↑ in Tripoli',
    summary: 'Refill gaps after pharmacy supply disruption in North Lebanon. Limited partner coverage; lower confidence.',
    signals: [SIG.insulin(48, 'Tripoli', 22), SIG.heat(30, 4), SIG.seasonal(22)],
    stressors: ['heatwave', 'shortage'],
    suggested: [{ category: 'comms', title: 'Notify MoPH North district office', detail: 'Outside pilot network.' }],
  }),
  mkAlert({
    id: 'A-1044', condition: 'respiratory', district: 'zahle', ageGroups: ['65+'], rise: 19, horizonDays: 9,
    windowStart: d(3), windowEnd: d(9), confidence: 0.6, status: 'new', createdAt: at(0, 5, 22),
    baseline: 4.1, expected: 4.9,
    title: 'COPD exacerbations may ↑ in Zahle',
    summary: 'Dust event across the Bekaa with generator smoke; PHC visits rising.',
    signals: [SIG.dust(44), SIG.resp_visits(34, 'Zahle', 16), SIG.power(22, 6)],
    stressors: ['dust', 'power_cuts'],
    suggested: [{ category: 'comms', title: 'Share air-quality advisory with Bekaa PHCs', detail: '' }],
  }),
];

/* ------------------------------------------------------------------ */
/* Action plans (Act)                                                   */
/* ------------------------------------------------------------------ */
export const SEED_ACTIONS = [
  { id: 'ACT-301', alertId: 'A-1040', category: 'medicines', title: 'Order salbutamol & ipratropium nebules (2 weeks cover)', owner: 'u-pharm', due: d(1), status: 'in_progress', createdAt: at(-2, 8, 5), note: 'PO #4471 sent to Levant Pharma.' },
  { id: 'ACT-302', alertId: 'A-1040', category: 'beds', title: 'Prepare 3 pulmonary beds with oxygen', owner: 'u-karim', due: d(2), status: 'todo', createdAt: at(-2, 8, 6) },
  { id: 'ACT-303', alertId: 'A-1040', category: 'outreach', title: 'Advise COPD patients via PHCs to stay indoors on dust days', owner: 'u-nadine', due: d(0), status: 'done', createdAt: at(-2, 8, 7), completedAt: at(-1, 15, 20) },
  { id: 'ACT-304', alertId: 'A-1040', category: 'comms', title: 'Share air-quality advisory with partner PHCs', owner: 'u-rania', due: d(-1), status: 'done', createdAt: at(-2, 8, 8), completedAt: at(-2, 11, 40) },
  { id: 'ACT-305', alertId: 'A-1036', category: 'medicines', title: 'Coordinate insulin bridging supply with partner pharmacies', owner: 'u-pharm', due: d(0), status: 'in_progress', createdAt: at(-4, 8, 0) },
  { id: 'ACT-306', alertId: 'A-1036', category: 'outreach', title: 'PHC calls to insulin-dependent 65+ patients', owner: 'u-nadine', due: d(1), status: 'in_progress', createdAt: at(-4, 8, 1) },
  { id: 'ACT-307', alertId: 'A-1036', category: 'staff', title: 'Brief diabetes educator team on bridging protocol', owner: 'u-rania', due: d(-2), status: 'done', createdAt: at(-4, 8, 2), completedAt: at(-3, 10, 0) },
  { id: 'ACT-308', alertId: 'A-1041', category: 'beds', title: 'Hold 2 cardiology step-down beds from day 6', owner: 'u-karim', due: d(5), status: 'todo', createdAt: at(-1, 8, 20) },
];

/* ------------------------------------------------------------------ */
/* Users                                                                */
/* ------------------------------------------------------------------ */
export const SEED_USERS = [
  { id: 'u-admin', name: 'Marsad Admin', email: 'admin@marsad.health', role: 'admin', org: 'Marsad Platform', status: 'active', lastActive: at(0, 7, 40), mfa: true },
  { id: 'u-rania', name: 'Dr. Rania Khoury', email: 'r.khoury@alarz-mc.lb', role: 'director', org: 'Al-Arz Medical Center', status: 'active', lastActive: at(0, 7, 46), mfa: true },
  { id: 'u-karim', name: 'Dr. Karim Haddad', email: 'k.haddad@alarz-mc.lb', role: 'er_head', org: 'Al-Arz Medical Center', status: 'active', lastActive: at(0, 7, 31), mfa: true },
  { id: 'u-pharm', name: 'Lina Aziz', email: 'l.aziz@alarz-mc.lb', role: 'er_head', title: 'Chief Pharmacist', org: 'Al-Arz Medical Center', status: 'active', lastActive: at(-1, 16, 5), mfa: true },
  { id: 'u-rami', name: 'Rami Aoun', email: 'r.aoun@alarz-mc.lb', role: 'dpo', org: 'Al-Arz Medical Center', status: 'active', lastActive: at(-1, 11, 12), mfa: true },
  { id: 'u-georges', name: 'Georges Khalil', email: 'g.khalil@alarz-mc.lb', role: 'board', org: 'Al-Arz Medical Center', status: 'active', lastActive: at(-6, 18, 0), mfa: false },
  { id: 'u-maya', name: 'Dr. Maya Saliba', email: 'maya@levantdx.lb', role: 'lab_director', org: 'Levant Diagnostics Network', status: 'active', lastActive: at(-1, 9, 15), mfa: true },
  { id: 'u-nadine', name: 'Nadine Farah', email: 'n.farah@hadath-phc.lb', role: 'phc', org: 'Hadath Primary Health Centre', status: 'active', lastActive: at(0, 8, 2), mfa: true },
  { id: 'u-elie', name: 'Elie Mansour', email: 'e.mansour@moph.gov.lb', role: 'moph', org: 'Ministry of Public Health', status: 'active', lastActive: at(-2, 13, 44), mfa: true },
  { id: 'u-sami', name: 'Dr. Sami Rizk', email: 's.rizk@matnvalley.lb', role: 'director', org: 'Matn Valley Hospital', status: 'active', lastActive: at(0, 7, 55), mfa: true },
  { id: 'u-hiba', name: 'Hiba Nassar', email: 'h.nassar@chiyah-phc.lb', role: 'phc', org: 'Chiyah PHC', status: 'invited', lastActive: null, mfa: false },
  { id: 'u-omar', name: 'Dr. Omar Itani', email: 'o.itani@keserwan-uh.lb', role: 'director', org: 'Keserwan University Hospital', status: 'invited', lastActive: null, mfa: false },
  { id: 'u-joe', name: 'Joe Barakat', email: 'j.barakat@alarz-mc.lb', role: 'er_head', org: 'Al-Arz Medical Center', status: 'suspended', lastActive: at(-40, 10, 0), mfa: false },
];

/* ------------------------------------------------------------------ */
/* Data network (Connect)                                               */
/* ------------------------------------------------------------------ */
export const SEED_PARTNERS = [
  { id: 'p-alarz', name: 'Al-Arz Medical Center', type: 'hospital', district: 'baabda', status: 'live', lastSync: at(0, 4, 10), records30: 18420, quality: 97, fields: ['admissions', 'lab_results', 'stock', 'beds'], agreement: 'live', joined: d(-41), contact: 'Rami Aoun', integration: 'HIS · HL7 v2 via SFTP', beds: 220, sector: 'Private' },
  { id: 'p-matn', name: 'Matn Valley Hospital', type: 'hospital', district: 'matn', status: 'live', lastSync: at(0, 4, 20), records30: 12210, quality: 94, fields: ['admissions', 'lab_results', 'beds'], agreement: 'live', joined: d(-38), contact: 'Dr. Sami Rizk', integration: 'HIS · FHIR R4 API', beds: 160, sector: 'Private' },
  { id: 'p-chouf', name: 'Chouf Governmental Hospital', type: 'hospital', district: 'chouf', status: 'delayed', lastSync: at(-1, 22, 0), records30: 5130, quality: 86, fields: ['admissions', 'beds'], agreement: 'live', joined: d(-30), contact: 'Dr. Walid Hamdan', integration: 'CSV upload (weekly → daily)', beds: 90, sector: 'Public' },
  { id: 'p-keserwan', name: 'Keserwan University Hospital', type: 'hospital', district: 'keserwan', status: 'onboarding', lastSync: null, records30: 0, quality: null, fields: ['admissions'], agreement: 'dsa', joined: d(-6), contact: 'Dr. Omar Itani', integration: 'HIS · FHIR R4 API (testing)', beds: 310, sector: 'Private' },
  { id: 'p-aley', name: 'Aley Community Hospital', type: 'hospital', district: 'aley', status: 'live', lastSync: at(0, 3, 55), records30: 3940, quality: 91, fields: ['admissions', 'beds'], agreement: 'live', joined: d(-27), contact: 'Dr. Fadi Chamoun', integration: 'CSV via secure portal', beds: 75, sector: 'Private' },
  { id: 'p-jbeil', name: 'Jbeil Coastal Hospital', type: 'hospital', district: 'jbeil', status: 'live', lastSync: at(0, 4, 2), records30: 6020, quality: 92, fields: ['admissions', 'lab_results'], agreement: 'live', joined: d(-33), contact: 'Dr. Carla Daher', integration: 'HIS · HL7 v2', beds: 130, sector: 'Private' },
  { id: 'p-levant', name: 'Levant Diagnostics Network', type: 'lab', district: 'baabda', status: 'live', lastSync: at(0, 5, 0), records30: 41250, quality: 98, fields: ['lab_results'], agreement: 'live', joined: d(-41), contact: 'Dr. Maya Saliba', integration: 'LIS · HL7 ORU feed (12 branches)', branches: 12 },
  { id: 'p-cedar', name: 'Cedar Clinical Labs', type: 'lab', district: 'matn', status: 'live', lastSync: at(0, 4, 45), records30: 15880, quality: 95, fields: ['lab_results'], agreement: 'live', joined: d(-35), contact: 'Dr. Tony Gemayel', integration: 'LIS · CSV nightly', branches: 5 },
  { id: 'p-medlab', name: 'MedLab Mount Lebanon', type: 'lab', district: 'aley', status: 'error', lastSync: at(-2, 3, 0), records30: 7200, quality: 88, fields: ['lab_results'], agreement: 'live', joined: d(-29), contact: 'Rita Khoury', integration: 'LIS · SFTP', branches: 4, error: 'Certificate expired on SFTP endpoint — files rejected since 2 days.' },
  { id: 'p-hadath', name: 'Hadath Primary Health Centre', type: 'phc', district: 'baabda', status: 'live', lastSync: at(0, 6, 0), records30: 2310, quality: 90, fields: ['missed_visits', 'refills'], agreement: 'live', joined: d(-39), contact: 'Nadine Farah', integration: 'PHC-MIS export (daily)' },
  { id: 'p-chiyah', name: 'Chiyah PHC', type: 'phc', district: 'baabda', status: 'live', lastSync: at(0, 6, 5), records30: 1980, quality: 87, fields: ['missed_visits', 'refills'], agreement: 'live', joined: d(-36), contact: 'Hiba Nassar', integration: 'PHC-MIS export (daily)' },
  { id: 'p-choueifat', name: 'Choueifat PHC', type: 'phc', district: 'aley', status: 'live', lastSync: at(0, 5, 50), records30: 1410, quality: 84, fields: ['missed_visits'], agreement: 'live', joined: d(-25), contact: 'Samar Abi Nader', integration: 'Manual upload (weekly)' },
  { id: 'p-damour', name: 'Damour PHC', type: 'phc', district: 'chouf', status: 'delayed', lastSync: at(-2, 9, 0), records30: 820, quality: 79, fields: ['missed_visits'], agreement: 'live', joined: d(-22), contact: 'Joelle Saab', integration: 'Manual upload (weekly)' },
  { id: 'p-jdeideh', name: 'Jdeideh PHC', type: 'phc', district: 'matn', status: 'live', lastSync: at(0, 6, 15), records30: 1650, quality: 89, fields: ['missed_visits', 'refills'], agreement: 'live', joined: d(-31), contact: 'Marc Haddad', integration: 'PHC-MIS export (daily)' },
  { id: 'p-pharm', name: 'Mount Lebanon Pharmacy Refill Network', type: 'pharmacy', district: 'baabda', status: 'live', lastSync: at(0, 2, 0), records30: 63400, quality: 93, fields: ['refills', 'stock'], agreement: 'live', joined: d(-37), contact: 'Order of Pharmacists liaison', integration: 'Pharmacy POS aggregator API', branches: 42 },
  { id: 'p-hope', name: 'Hope Health NGO (mobile clinics)', type: 'ngo', district: 'chouf', status: 'onboarding', lastSync: null, records30: 0, quality: null, fields: ['missed_visits'], agreement: 'loi', joined: d(-4), contact: 'Dana Moussa', integration: 'To be defined' },
  { id: 'p-met', name: 'Meteorological & air-quality feeds', type: 'public', district: 'beirut', status: 'live', lastSync: at(0, 6, 30), records30: 2160, quality: 99, fields: [], agreement: 'live', joined: d(-41), contact: 'Public open data', integration: 'Public API (hourly)' },
  { id: 'p-moph', name: 'MoPH medicine shortage list', type: 'public', district: 'beirut', status: 'live', lastSync: at(0, 1, 0), records30: 30, quality: 95, fields: ['stock'], agreement: 'live', joined: d(-41), contact: 'MoPH pharmacy dept.', integration: 'Public bulletin (daily scrape)' },
];

export const SEED_AGREEMENTS = [
  { id: 'AG-01', partnerId: 'p-keserwan', stage: 'dsa', updated: d(-3), owner: 'Rami Aoun', next: 'Technical go-live test', docs: ['LOI_Keserwan.pdf', 'DSA_Keserwan_v2.pdf'] },
  { id: 'AG-02', partnerId: 'p-hope', stage: 'loi', updated: d(-4), owner: 'Marsad Admin', next: 'Draft DSA with NGO legal', docs: ['LOI_HopeHealth.pdf'] },
  { id: 'AG-03', partnerId: null, name: 'Bourj Hammoud PHC', type: 'phc', district: 'matn', stage: 'draft', updated: d(-1), owner: 'Marsad Admin', next: 'Send LOI for signature', docs: [] },
  { id: 'AG-04', partnerId: null, name: 'Baabda Governmental Hospital', type: 'hospital', district: 'baabda', stage: 'draft', updated: d(-2), owner: 'Marsad Admin', next: 'Intro via Syndicate of Private Hospitals', docs: [] },
  { id: 'AG-05', partnerId: 'p-chouf', stage: 'live', updated: d(-30), owner: 'Rami Aoun', next: '—', docs: ['LOI_Chouf.pdf', 'DSA_Chouf.pdf'] },
];

/* ------------------------------------------------------------------ */
/* Readiness: wards, stock, rota                                        */
/* ------------------------------------------------------------------ */
export const SEED_WARDS = [
  { id: 'w-er', name: 'Emergency Department', beds: 24, occupied: 19, reserved: 0, forecastPeak: 26, condition: null },
  { id: 'w-im', name: 'Internal Medicine', beds: 48, occupied: 39, reserved: 0, forecastPeak: 46, condition: 'diabetes' },
  { id: 'w-ccu', name: 'Cardiology / CCU', beds: 20, occupied: 16, reserved: 0, forecastPeak: 21, condition: 'cardiac' },
  { id: 'w-pulm', name: 'Pulmonology', beds: 18, occupied: 12, reserved: 3, forecastPeak: 17, condition: 'respiratory' },
  { id: 'w-icu', name: 'Intensive Care', beds: 16, occupied: 13, reserved: 0, forecastPeak: 15, condition: null },
  { id: 'w-endo', name: 'Endocrine / Diabetes Unit', beds: 12, occupied: 8, reserved: 0, forecastPeak: 12, condition: 'diabetes' },
];

export const SEED_STOCK = [
  { id: 's1', name: 'Insulin glargine 100 U/mL pen', category: 'diabetes', unit: 'pens', onHand: 410, dailyUse: 32, projectedUse: 45, reorderPoint: 450, leadTimeDays: 5, supplier: 'Levant Pharma' },
  { id: 's2', name: 'Insulin aspart (rapid-acting)', category: 'diabetes', unit: 'vials', onHand: 260, dailyUse: 14, projectedUse: 19, reorderPoint: 200, leadTimeDays: 5, supplier: 'Levant Pharma' },
  { id: 's3', name: 'Glucose test strips', category: 'diabetes', unit: 'boxes', onHand: 520, dailyUse: 22, projectedUse: 27, reorderPoint: 300, leadTimeDays: 3, supplier: 'MedSupply SAL' },
  { id: 's4', name: 'IV normal saline 1 L', category: 'general', unit: 'bags', onHand: 1350, dailyUse: 95, projectedUse: 118, reorderPoint: 1100, leadTimeDays: 2, supplier: 'Pharmamed' },
  { id: 's5', name: 'Furosemide 20 mg/2 mL injection', category: 'cardiac', unit: 'ampoules', onHand: 300, dailyUse: 26, projectedUse: 34, reorderPoint: 350, leadTimeDays: 7, supplier: 'Levant Pharma' },
  { id: 's6', name: 'Nitroglycerin infusion', category: 'cardiac', unit: 'vials', onHand: 64, dailyUse: 3, projectedUse: 4, reorderPoint: 40, leadTimeDays: 7, supplier: 'Pharmamed' },
  { id: 's7', name: 'Salbutamol inhaler 100 mcg', category: 'respiratory', unit: 'inhalers', onHand: 85, dailyUse: 18, projectedUse: 26, reorderPoint: 200, leadTimeDays: 10, supplier: 'National shortage', shortage: true },
  { id: 's8', name: 'Ipratropium nebules', category: 'respiratory', unit: 'nebules', onHand: 640, dailyUse: 40, projectedUse: 55, reorderPoint: 500, leadTimeDays: 6, supplier: 'MedSupply SAL' },
  { id: 's9', name: 'Prednisolone 5 mg', category: 'respiratory', unit: 'tablets', onHand: 4200, dailyUse: 160, projectedUse: 190, reorderPoint: 2000, leadTimeDays: 4, supplier: 'Pharmamed' },
  { id: 's10', name: 'Medical oxygen cylinders (D-size)', category: 'respiratory', unit: 'cylinders', onHand: 58, dailyUse: 7, projectedUse: 10, reorderPoint: 60, leadTimeDays: 2, supplier: 'Lebanon Gas Co.' },
];

export const STAFF_ROLES = [
  { id: 'er_md', label: 'ER physicians', base: 4 },
  { id: 'er_rn', label: 'ER nurses', base: 9 },
  { id: 'im_rn', label: 'Internal medicine nurses', base: 12 },
  { id: 'rt', label: 'Respiratory therapists', base: 2 },
  { id: 'card', label: 'Cardiologists on call', base: 1 },
];

/* ------------------------------------------------------------------ */
/* PHC outreach (de-identified)                                         */
/* ------------------------------------------------------------------ */
function mkOutreach() {
  const r = mulberry32(42);
  const phcs = [
    { id: 'p-hadath', name: 'Hadath PHC', district: 'baabda' },
    { id: 'p-chiyah', name: 'Chiyah PHC', district: 'baabda' },
    { id: 'p-jdeideh', name: 'Jdeideh PHC', district: 'matn' },
    { id: 'p-choueifat', name: 'Choueifat PHC', district: 'aley' },
    { id: 'p-damour', name: 'Damour PHC', district: 'chouf' },
  ];
  const reasons = {
    diabetes: ['2 missed insulin refills', 'HbA1c 10.4% (last test)', 'HbA1c 11.2% + missed visit', 'Missed insulin refill + lives alone', 'Hypoglycaemia ER visit in last 60 days'],
    cardiac: ['Missed furosemide refill', 'NT-proBNP 1,850 pg/mL', 'Missed BP follow-up ×2', 'Heart-failure admission in last 90 days'],
    respiratory: ['No salbutamol refill in 30 days', 'COPD exacerbation in last 60 days', 'Home oxygen user — power cuts', 'Paediatric asthma, 2 ER visits'],
  };
  const lists = [
    { alertId: 'A-1042', condition: 'diabetes', district: 'baabda', n: 18 },
    { alertId: 'A-1036', condition: 'diabetes', district: 'matn', n: 12 },
    { alertId: 'A-1040', condition: 'respiratory', district: 'chouf', n: 10 },
    { alertId: 'A-1038', condition: 'cardiac', district: 'baabda', n: 10 },
  ];
  const statuses = ['pending', 'pending', 'pending', 'reached', 'no_answer', 'referred', 'reached'];
  const out = [];
  let k = 0;
  for (const l of lists) {
    const ph = phcs.filter((p) => p.district === l.district);
    for (let i = 0; i < l.n; i++) {
      const p = ph[i % ph.length];
      const code = (hashStr(l.alertId + i) % 0xfffff).toString(16).toUpperCase().padStart(5, '0');
      const age = l.condition === 'respiratory' && i % 4 === 3 ? '0-17' : r() > 0.45 ? '65+' : '45-64';
      const st = l.alertId === 'A-1042' || l.alertId === 'A-1038' ? 'pending' : statuses[Math.floor(r() * statuses.length)];
      out.push({
        id: `OR-${++k}`,
        pid: `MRS-${code}`,
        alertId: l.alertId,
        condition: l.condition,
        district: l.district,
        phcId: p.id,
        phc: p.name,
        ageBand: age,
        sex: r() > 0.5 ? 'F' : 'M',
        risk: Math.round(60 + r() * 38),
        reason: reasons[l.condition][Math.floor(r() * reasons[l.condition].length)],
        phone: `+961 ${['03', '70', '71', '76', '81'][Math.floor(r() * 5)]} ••• ${String(Math.floor(r() * 900) + 100)}`,
        status: st,
        attempts: st === 'pending' ? 0 : 1 + Math.floor(r() * 2),
        lastAttempt: st === 'pending' ? null : at(-Math.floor(r() * 2), 10 + Math.floor(r() * 6), Math.floor(r() * 59)),
        notes: st === 'reached' ? 'Refill arranged; advised hydration.' : st === 'referred' ? 'Referred for same-week PHC visit.' : '',
      });
    }
  }
  return out.sort((a, b) => b.risk - a.risk);
}
export const SEED_OUTREACH = mkOutreach();

export const OUTREACH_STATUS = {
  pending: { label: 'To call', cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  reached: { label: 'Reached', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  no_answer: { label: 'No answer', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  referred: { label: 'Referred', cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  declined: { label: 'Declined', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

/* ------------------------------------------------------------------ */
/* Notifications & audit                                                */
/* ------------------------------------------------------------------ */
export const SEED_NOTIFICATIONS = [
  { id: 'n1', type: 'alert', title: 'New high alert: Diabetes ↑38% in Baabda', body: 'Window starts in 3 days. Open “Why this alert?”.', at: at(0, 5, 12), read: false, link: '/app/alerts/A-1042' },
  { id: 'n2', type: 'alert', title: 'New high alert: Cardiac ↑31% in Baabda', body: 'Patients 65+, 11-day horizon.', at: at(0, 5, 10), read: false, link: '/app/alerts/A-1038' },
  { id: 'n3', type: 'brief', title: 'Your morning brief is ready', body: 'Three things rising this week. Est. reading time 2 min.', at: at(0, 6, 0), read: false, link: '/app/brief' },
  { id: 'n4', type: 'feed', title: 'MedLab Mount Lebanon feed failing', body: 'SFTP certificate expired — 2 days of lab files missing.', at: at(-1, 8, 30), read: false, link: '/app/network' },
  { id: 'n5', type: 'stock', title: 'Salbutamol inhalers below reorder point', body: '3.3 days of cover at projected demand.', at: at(-1, 7, 0), read: true, link: '/app/readiness' },
  { id: 'n6', type: 'action', title: 'Action completed: COPD advisory sent', body: 'Nadine Farah marked the outreach action done.', at: at(-1, 15, 20), read: true, link: '/app/actions' },
  { id: 'n7', type: 'partner', title: 'Keserwan University Hospital signed the DSA', body: 'Technical go-live test scheduled.', at: at(-3, 12, 0), read: true, link: '/app/network' },
];

export const SEED_AUDIT = [
  { id: 'au1', at: at(0, 7, 46), user: 'Dr. Rania Khoury', role: 'director', action: 'VIEW', object: 'Morning brief', detail: 'Opened brief', ip: '10.12.4.21' },
  { id: 'au2', at: at(0, 6, 0), user: 'Marsad engine', role: 'system', action: 'GENERATE', object: 'Morning brief', detail: 'Brief generated for 6 hospitals', ip: '—' },
  { id: 'au3', at: at(0, 5, 12), user: 'Marsad engine', role: 'system', action: 'CREATE', object: 'Alert A-1042', detail: 'Diabetes · Baabda · confidence 0.82', ip: '—' },
  { id: 'au4', at: at(0, 5, 0), user: 'Levant Diagnostics Network', role: 'partner', action: 'INGEST', object: 'Lab results feed', detail: '1,402 records · de-identified at source · k ≥ 10', ip: '185.33.x.x' },
  { id: 'au5', at: at(0, 4, 10), user: 'Al-Arz Medical Center', role: 'partner', action: 'INGEST', object: 'Admissions feed', detail: '612 records · pseudonymised IDs', ip: '10.12.0.5' },
  { id: 'au6', at: at(-1, 15, 20), user: 'Nadine Farah', role: 'phc', action: 'UPDATE', object: 'Action ACT-303', detail: 'Status → Done', ip: '10.40.2.18' },
  { id: 'au7', at: at(-1, 11, 12), user: 'Rami Aoun', role: 'dpo', action: 'EXPORT', object: 'Audit log', detail: 'CSV export · last 30 days', ip: '10.12.4.40' },
  { id: 'au8', at: at(-1, 9, 2), user: 'Dr. Karim Haddad', role: 'er_head', action: 'UPDATE', object: 'Alert A-1041', detail: 'Status → Acknowledged', ip: '10.12.4.33' },
  { id: 'au9', at: at(-2, 8, 5), user: 'Dr. Rania Khoury', role: 'director', action: 'CREATE', object: 'Action plan A-1040', detail: '4 actions created', ip: '10.12.4.21' },
  { id: 'au10', at: at(-2, 3, 0), user: 'MedLab Mount Lebanon', role: 'partner', action: 'REJECT', object: 'Lab results feed', detail: 'TLS certificate expired — file rejected', ip: '91.208.x.x' },
  { id: 'au11', at: at(-3, 12, 0), user: 'Rami Aoun', role: 'dpo', action: 'APPROVE', object: 'Agreement AG-01', detail: 'DSA signed — Keserwan University Hospital', ip: '10.12.4.40' },
  { id: 'au12', at: at(-3, 10, 30), user: 'Marsad Admin', role: 'admin', action: 'PERMISSION', object: 'Role: PHC Coordinator', detail: 'Granted view: Outreach call lists (own PHC only)', ip: '10.0.0.2' },
  { id: 'au13', at: at(-4, 14, 0), user: 'Elie Mansour', role: 'moph', action: 'VIEW', object: 'National overview', detail: 'District-level aggregates only', ip: '172.16.8.4' },
  { id: 'au14', at: at(-5, 9, 0), user: 'Dr. Maya Saliba', role: 'lab_director', action: 'VIEW', object: 'Benchmarks', detail: 'Lab benchmark report Q3', ip: '185.33.x.x' },
  { id: 'au15', at: at(-6, 16, 40), user: 'Marsad Admin', role: 'admin', action: 'UPDATE', object: 'Anonymisation rules', detail: 'Minimum cell size k = 10 confirmed', ip: '10.0.0.2' },
];

/* ------------------------------------------------------------------ */
/* Pilot, assumptions, interviews, reports                              */
/* ------------------------------------------------------------------ */
export const SEED_ASSUMPTIONS = [
  { id: 'H1', text: 'Surges regularly catch hospitals unprepared', check: '5 interviews about the last surge', proof: '4 of 5 describe one they learned of too late', risk: 'HIGH', status: 'testing', evidence: '2 of 2 interviews so far describe a surprise surge.' },
  { id: 'H2', text: 'Directors will trust an explainable alert', check: 'MVP walkthrough with 6 users', proof: '4 of 6 explain it and name an action', risk: 'HIGH', status: 'testing', evidence: 'Live pilot feedback is tracked on this page.' },
  { id: 'H3', text: 'Hospitals & labs will share anonymised data', check: 'Talks with 2 labs and 2 CIOs / DPOs', proof: '2 letters of intent for a pilot', risk: 'HIGH', status: 'validated', evidence: '3 labs live; Keserwan DSA signed; Hope Health LOI.' },
  { id: 'H4', text: 'Warning signs appear 1–2 weeks early', check: 'Historical data from 1 hospital + lab', proof: 'Signals lead peaks by ≥ 7 days', risk: 'MEDIUM', status: 'validated', evidence: 'Back-test median lead time 9 days (n = 14 surges).' },
  { id: 'H5', text: 'Hospitals will pay ≈ $8,000 / year', check: 'Pricing questions with 5 administrators', proof: '3 of 5 call it fair or cheap', risk: 'MEDIUM', status: 'untested', evidence: '' },
  { id: 'H6', text: 'Ministry or donors would co-fund', check: '1 MoPH and 2 donor conversations', proof: '1 concrete co-funding interest', risk: 'MEDIUM', status: 'testing', evidence: 'MoPH district-licence discussion opened.' },
  { id: 'H7', text: 'Partner data quality is good enough to forecast', check: 'Data-quality score per feed', proof: '≥ 85% completeness for 80% of feeds', risk: 'MEDIUM', status: 'testing', evidence: '13 of 16 active feeds ≥ 85%.' },
  { id: 'H8', text: 'HIS vendors will support integration', check: 'Talks with 2 HIS vendors', proof: '1 vendor commits to a FHIR connector', risk: 'LOW', status: 'untested', evidence: '' },
];

export const SEED_INTERVIEWS = [
  { id: 'I1', who: 'Medical director (private hospital)', owner: 'Juliana & Raman', date: '2026-10-16', status: 'scheduled' },
  { id: 'I2', who: 'Medical director (public hospital)', owner: 'Juliana & Raman', date: '2026-10-16', status: 'scheduled' },
  { id: 'I3', who: 'ER / internal-medicine head', owner: 'Juliana & Raman', date: '2026-10-16', status: 'scheduled' },
  { id: 'I4', who: 'Laboratory director', owner: 'Sary & Rafic', date: '2026-10-16', status: 'scheduled' },
  { id: 'I5', who: 'PHC coordinator or MoPH officer', owner: 'Sary & Rafic', date: '2026-10-16', status: 'scheduled' },
];

export const INTERVIEW_QUESTIONS = [
  'Tell me about the last time your ER was overwhelmed by chronic patients.',
  'How did you first find out — and could anyone have seen it earlier?',
  'What did you do in the next 48 hours, and what did it cost?',
  'What information do you use each week to plan beds, staff and medicines?',
  'Last time you needed data from a lab or PHC — how did you get it?',
];

export const MVP_SESSIONS = [
  { id: 'T1', participant: 'Medical director A', role: 'director', explained: true, action: true, trust: 4, wouldPilot: true },
  { id: 'T2', participant: 'Medical director B', role: 'director', explained: true, action: true, trust: 5, wouldPilot: true },
  { id: 'T3', participant: 'ER doctor A', role: 'er_head', explained: true, action: true, trust: 4, wouldPilot: false },
  { id: 'T4', participant: 'ER doctor B', role: 'er_head', explained: false, action: true, trust: 3, wouldPilot: false },
  { id: 'T5', participant: 'Lab director', role: 'lab_director', explained: true, action: false, trust: 4, wouldPilot: true },
  { id: 'T6', participant: 'Public-health contact', role: 'moph', explained: true, action: true, trust: 4, wouldPilot: false },
];

export const SEED_REPORTS = [
  { id: 'R-Q3', title: 'Quarterly impact report · Pilot Q3 2026', period: 'Jul – Sep 2026', type: 'quarterly', status: 'published', created: d(-8), audience: ['Board', 'MoPH'] },
  { id: 'R-M2', title: 'Monthly review · Month 1 of pilot', period: 'Last 30 days', type: 'monthly', status: 'published', created: d(-11), audience: ['Medical directors'] },
  { id: 'R-M3', title: 'Monthly review · Month 2 of pilot', period: 'Current month', type: 'monthly', status: 'draft', created: d(-1), audience: ['Medical directors'] },
];

export const SEED_LICENCES = [
  { id: 'L1', buyer: 'Ministry of Public Health', scope: 'Mount Lebanon governorate', price: 40000, status: 'negotiation', note: 'District licence feeds the national surveillance unit.' },
  { id: 'L2', buyer: 'International donor (health systems fund)', scope: 'Mount Lebanon + Beirut', price: 40000, status: 'proposal', note: 'Co-funding of first-year pilot network.' },
  { id: 'L3', buyer: 'NSSF', scope: 'Chronic-care beneficiaries, pilot districts', price: 40000, status: 'prospect', note: 'Interest in avoided-admission savings.' },
];

/* ------------------------------------------------------------------ */
/* Computed series (forecasts, signals, risk)                           */
/* ------------------------------------------------------------------ */
const RATE = { diabetes: 1.25, cardiac: 1.7, respiratory: 1.4 }; // network admissions / 100k / day

export function baseDaily(districtId, condition) {
  const dist = DISTRICTS.find((x) => x.id === districtId);
  if (!dist) return 1;
  return (dist.population / 100000) * RATE[condition];
}

function alertBoost(districtId, condition, offset) {
  let mult = 1;
  for (const a of SEED_ALERTS) {
    if (a.district !== districtId || a.condition !== condition) continue;
    if (a.status === 'dismissed') continue;
    const s = Math.round((new Date(a.windowStart) - TODAY) / 86400000);
    const e = Math.round((new Date(a.windowEnd) - TODAY) / 86400000);
    if (offset < s - 3 || offset > e + 2) continue;
    const mid = (s + e) / 2;
    const half = (e - s) / 2 + 2.5;
    const t = 1 - Math.min(1, Math.abs(offset - mid) / half);
    const rise = a.outcome ? a.outcome.observedRise : a.rise;
    mult = Math.max(mult, 1 + (rise / 100) * (0.35 + 0.9 * t * t));
  }
  return mult;
}

/** Daily series for one or many districts: 28 days history + 14 days forecast. */
export function getSeries(districtIds, condition, opts = {}) {
  const ids = Array.isArray(districtIds) ? districtIds : [districtIds];
  const conds = condition === 'all' ? CONDITIONS.map((c) => c.id) : [condition];
  const past = opts.past ?? 28;
  const out = [];
  for (let off = -past; off <= 14; off++) {
    let base = 0;
    let val = 0;
    for (const id of ids) {
      for (const c of conds) {
        const b = baseDaily(id, c);
        const r = mulberry32(hashStr(id + c + off));
        const weekly = 1 + 0.08 * Math.sin(((off + 3) / 7) * Math.PI * 2);
        base += b;
        val += b * weekly * alertBoost(id, c, off) * (0.9 + r() * 0.2);
      }
    }
    const date = addDays(TODAY, off);
    const unc = off <= 0 ? 0 : 0.06 + off * 0.012;
    out.push({
      off,
      date: iso(date),
      baseline: +base.toFixed(1),
      actual: off <= 0 ? +val.toFixed(1) : null,
      forecast: off >= -6 ? +val.toFixed(1) : null,
      lower: off >= 0 ? +(val * (1 - unc)).toFixed(1) : null,
      upper: off >= 0 ? +(val * (1 + unc)).toFixed(1) : null,
      band: off >= 0 ? [+(val * (1 - unc)).toFixed(1), +(val * (1 + unc)).toFixed(1)] : null,
    });
  }
  return out;
}

/** Risk score 0–100 for a district/condition/age group over a horizon (7 or 14). */
export function riskScore(districtId, condition, ageGroup = 'all', horizon = 14) {
  const r = mulberry32(hashStr(districtId + condition));
  let s = 18 + r() * 30;
  for (const a of SEED_ALERTS) {
    if (a.district === districtId && a.condition === condition && ['new', 'acknowledged', 'action_planned'].includes(a.status)) {
      const startsIn = Math.round((new Date(a.windowStart) - TODAY) / 86400000);
      const inHorizon = startsIn <= horizon;
      s = Math.max(s, (inHorizon ? 45 : 30) + a.rise * 1.2 * (inHorizon ? 1 : 0.6));
      if (ageGroup !== 'all' && !a.ageGroups.includes(ageGroup)) s *= 0.65;
    }
  }
  if (ageGroup !== 'all') {
    const ageMult = { '0-17': condition === 'respiratory' ? 0.9 : 0.45, '18-44': 0.7, '45-64': 1, '65+': 1.12 }[ageGroup];
    s *= ageMult;
  }
  if (horizon === 7) s *= 0.92;
  return Math.round(clamp(s, 3, 98));
}

export function overallRisk(districtId, ageGroup = 'all', horizon = 14) {
  return Math.max(...CONDITIONS.map((c) => riskScore(districtId, c.id, ageGroup, horizon)));
}

export function riskBand(score) {
  if (score >= 70) return { id: 'high', label: 'High', color: '#c2334b' };
  if (score >= 50) return { id: 'elevated', label: 'Elevated', color: '#e07a2f' };
  if (score >= 35) return { id: 'moderate', label: 'Moderate', color: '#e6b93a' };
  return { id: 'low', label: 'Low', color: '#5fb3a5' };
}

/** Weekly early-signal series per district. */
export function labSignals(districtId) {
  const r = mulberry32(hashStr('lab' + districtId));
  const hasAlert = (c) => SEED_ALERTS.some((a) => a.district === districtId && a.condition === c && ['new', 'acknowledged', 'action_planned'].includes(a.status));
  const weeks = 12;
  const mk = (base, rise, noise) =>
    Array.from({ length: weeks }, (_, i) => {
      const t = i / (weeks - 1);
      return +(base + rise * t * t + (r() - 0.5) * noise).toFixed(1);
    });
  const labels = Array.from({ length: weeks }, (_, i) => addDays(TODAY, -7 * (weeks - 1 - i)));
  return labels.map((date, i) => ({
    date: iso(date),
    hba1c: mk(20, hasAlert('diabetes') ? 9 : 1.5, 2)[i],
    bnp: mk(13, hasAlert('cardiac') ? 9 : 1, 2)[i],
    eos: mk(7, hasAlert('respiratory') ? 5 : 0.8, 1.2)[i],
    insulin: mk(10, hasAlert('diabetes') ? 8 : 1, 1.6)[i],
    diuretic: mk(8, hasAlert('cardiac') ? 6 : 0.8, 1.4)[i],
    inhaler: mk(12, hasAlert('respiratory') ? 10 : 1, 2)[i],
    missed: mk(16, hasAlert('diabetes') || hasAlert('cardiac') ? 6 : 1, 2)[i],
  }));
}

export function stressorForecast() {
  const r = mulberry32(777);
  return Array.from({ length: 15 }, (_, i) => {
    const heat = i >= 3 && i <= 7 ? 38 + r() * 3 : 31 + r() * 4;
    const power = i >= 2 && i <= 9 ? 5 + r() * 2 : 9 + r() * 3;
    const pm10 = i >= 1 && i <= 4 ? 140 + r() * 40 : 50 + r() * 30;
    return { off: i, date: iso(addDays(TODAY, i)), heat: +heat.toFixed(1), power: +power.toFixed(1), pm10: Math.round(pm10) };
  });
}

export const SHORTAGES = [
  { id: 'sh1', item: 'Salbutamol inhaler 100 mcg', since: d(-9), severity: 'high', share: 31, districts: ['chouf', 'aley', 'baabda'], condition: 'respiratory' },
  { id: 'sh2', item: 'Furosemide 40 mg tablets', since: d(-5), severity: 'medium', share: 12, districts: ['matn'], condition: 'cardiac' },
  { id: 'sh3', item: 'Insulin NPH (intermediate)', since: d(-12), severity: 'medium', share: 18, districts: ['matn', 'tripoli'], condition: 'diabetes' },
  { id: 'sh4', item: 'Glucose test strips (brand X)', since: d(-3), severity: 'low', share: 6, districts: ['aley'], condition: 'diabetes' },
];

export const IMPACT = {
  alertsIssued: 31,
  leadTimeMedian: 9,
  precision: 0.78,
  avoidedAdmissions: 37,
  stockoutsPrevented: 5,
  actionsCompleted: 64,
  outreachReached: 412,
  erBoardingHoursReduced: 0.21,
  briefOpenRate: 0.86,
  trust: 4.1,
  savingsUsd: 92500,
  monthly: [
    { m: 'Month 1', alerts: 13, accurate: 10, avoided: 14, actions: 27 },
    { m: 'Month 2', alerts: 18, accurate: 14, avoided: 23, actions: 37 },
  ],
  byCondition: [
    { condition: 'diabetes', alerts: 14, avoided: 19 },
    { condition: 'cardiac', alerts: 9, avoided: 11 },
    { condition: 'respiratory', alerts: 8, avoided: 7 },
  ],
};

export const BENCHMARKS = {
  partnerId: 'p-levant',
  turnaroundHours: 6.2,
  networkTurnaround: 9.8,
  completeness: 98,
  networkCompleteness: 91,
  contributionShare: 0.47,
  alertsInformed: 19,
  districts: ['baabda', 'matn', 'aley', 'chouf', 'keserwan', 'jbeil', 'beirut'].map((id, i) => ({
    district: id,
    yourHba1c: [27.8, 26.4, 22.1, 25.3, 20.2, 19.6, 23.4][i],
    networkHba1c: [26.1, 25.2, 23.0, 24.4, 21.5, 20.8, 22.9][i],
    tests: [1284, 960, 410, 380, 220, 190, 640][i],
  })),
};

export const DEFAULT_SETTINGS = {
  briefTime: '06:00',
  briefEmail: true,
  briefWhatsapp: false,
  briefRecipients: 'r.khoury@alarz-mc.lb, k.haddad@alarz-mc.lb',
  minConfidence: 0.55,
  minRise: 10,
  conditions: { diabetes: true, cardiac: true, respiratory: true },
  catchment: ['baabda', 'aley', 'matn', 'chouf'],
  notifyHigh: true,
  notifyMedium: true,
  notifyLow: false,
  notifyFeeds: true,
  notifyStock: true,
  kAnonymity: 10,
  ageBanding: true,
  districtOnly: true,
  retentionMonths: 24,
  language: 'en',
};
