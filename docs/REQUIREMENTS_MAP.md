# Marsad: requirements map (from *Marsad_Challenge4_Pitch.pptx*)

This document turns every slide of the pitch deck into requirements for the prototype and for the production team. Each item is tagged with the slide it came from (S1–S15) and with the screen or route that implements it.

---

## 1. Product summary
* **Name:** Marsad ("observatory"). *AI-powered chronic disease surveillance & early warning for hospitals* (S1).
* **Promise:** hospitals see diabetic, cardiac and respiratory surges **7–14 days** before they reach the ER (S1, S7).
* **Root cause addressed:** chronic-disease data is fragmented across hospitals, labs, PHCs and pharmacies, and there is no secure way to combine it (S4, S5).
* **Core loop:** **Connect → Detect → Act** (S6).

## 2. User roles (S2, S3, S10)
| Role | Type | What they need | Default landing page |
|---|---|---|---|
| Hospital Medical Director (primary user, persona Dr. Rania Khoury) | User | 2-minute morning brief, alerts with reasons, action plan, readiness | Morning Brief |
| ER / Internal-Medicine Head | User | Expected ER load, bed reservations, staff rota | Morning Brief |
| Laboratory Director | Data partner (joins free) | Data contribution status, benchmarks returned | Benchmarks |
| PHC Coordinator | Data partner / outreach | Call lists for high-risk patients (de-identified) | PHC Outreach |
| MoPH Analyst | Payer / decision-maker | National, district-level view; district licence | National Overview |
| CIO / Data-Protection Officer | Decision-maker | Permissions, anonymisation, audit trail, agreements | Privacy & Audit |
| Hospital CEO / Board | Decision-maker / payer | Impact reports, subscription | Impact Reports |
| System Administrator (demo login `admin` / `123456`) | Platform admin | Everything, plus "view as" any role | Morning Brief |

Beneficiaries shown in the impact data: chronic patients, families, nurses & doctors, vulnerable districts (S2).
Payers shown in the subscription and licence data: hospitals, MoPH, NSSF & insurers, donors (S2, S11).

## 3. Feature inventory → screens
| # | Feature (deck source) | Screen / route |
|---|---|---|
| F1 | Public home page explaining the value proposition and how it works (S6, S7, S8) | `/` Home |
| F2 | Secure sign-in, role-based (S6 "role-based, audited") | `/login` |
| F3 | **2-minute morning brief**: what's rising, 7–14-day forecast, risk map, suggested actions (S3, S6, S9 screen 1) | `/app/brief` |
| F4 | 7:45 am bed-huddle mode that replaces the whiteboard (S3 "DOES") | Brief → *Start huddle* (full-screen) |
| F5 | Daily email brief (S11 Channels) | Brief → *Email preview*; Settings → delivery time |
| F6 | Alerts by district × condition × age group (S6 Detect) | `/app/alerts` |
| F7 | **"Why this alert?"**: explainable signals, sources, stressors, confidence (S6, S9 screen 2) | `/app/alerts/:id` |
| F8 | Trust feedback per alert: understood? trust 1–5, would act (S9 pass criteria) | Alert detail → Feedback panel |
| F9 | **Action plan**: beds / medicines / PHC calls / staff, owners, due dates, status (S9 screen 3) | `/app/actions`, Alert detail → Action plan |
| F10 | Risk map by district, condition, age group and horizon (S6) | `/app/map` |
| F11 | Admissions forecasts per district, 7–14 days ahead, with confidence band (S6 AI work) | `/app/forecasts` |
| F12 | Early signals: lab values (HbA1c, BNP, eosinophils), missed refills; stressors: heatwaves, power cuts, shortages (S4, S6) | `/app/signals` |
| F13 | Readiness: beds, staff rotas, medicine stock against projected demand; avoid panic orders and stock-outs (S3, S7) | `/app/readiness` |
| F14 | PHC outreach call lists for high-risk patients, de-identified (S9 action "ask PHCs to call high-risk patients") | `/app/outreach` |
| F15 | **Connect**: partner network (hospitals, labs, PHCs, pharmacies), feeds, sync status, permission-controlled sharing, invite partner (S6, S11 Key partners) | `/app/network` |
| F16 | Data-sharing agreements / letters of intent (S11 Key resources, S14) | Network → Agreements tab |
| F17 | Benchmarks returned free to labs and PHCs (S11 notes) | `/app/benchmarks` |
| F18 | Privacy by design: de-identification, role-based access, audit log (S6) | `/app/governance` |
| F19 | National / district view for MoPH; district licence (S2, S8 "feeds the Ministry", S11) | `/app/national` |
| F20 | Quarterly impact report and monthly review, proof of impact for the board and Ministry (S7, S11) | `/app/reports` |
| F21 | Subscription by bed size ($4,800 / $9,600 / $18,000), free 3-month pilot, district licence ≈ $40K, never selling data (S11, S12) | `/app/subscription` |
| F22 | Pilot program: 90-day pilot, MVP pass criteria, assumption tracker (S9, S13, S14, S15) | `/app/pilot` |
| F23 | User and role management (S2 decision-makers, S6 role-based) | `/app/users` |
| F24 | Settings: brief schedule, alert thresholds, notification channels, demo reset | `/app/settings` |
| F25 | Notifications centre, global search (⌘K), role switcher | App shell |

## 4. Key workflows
1. **Morning routine (S3, S9):** sign in → Morning Brief (≈2 min) → open the top alert → *Why this alert?* → give feedback → *Create action plan* → assign owners → mark the brief as reviewed.
2. **Alert lifecycle:** `New → Acknowledged → Action planned → Resolved`, or `Dismissed` (a reason is required). Every transition is written to the audit log.
3. **Action lifecycle:** `To do → In progress → Done`, with an owner, a due date and a category (Beds / Medicines / Outreach / Staff / Communication).
4. **Partner onboarding (Connect):** invite partner → agreement *Draft → LOI signed → DSA signed → Live* → choose the data fields shared → feed sync and health status.
5. **PHC outreach:** an action creates a call list → the coordinator logs each call (Reached / No answer / Referred / Declined).
6. **Governance:** the DPO reviews the access matrix, sets anonymisation rules (minimum cell size k ≥ 10, age banding, district-level only) and exports the audit log.
7. **Reporting:** generate the quarterly impact report → preview → export / share with the board or Ministry.

## 5. Data entities (mocked in `src/data/seed.js`)
`District`, `Condition` (diabetes, cardiac, respiratory), `AgeGroup`, `Hospital`, `Partner` (hospital / lab / PHC / pharmacy), `DataFeed`, `Agreement`, `Alert` (signals, stressors, forecast, confidence, status, feedback), `Action`, `ForecastSeries`, `LabSignal`, `RefillSignal`, `Stressor` (heat, power cuts, shortages), `Ward`/`BedCapacity`, `StaffRota`, `StockItem`, `OutreachContact` (pseudonymous ID), `Notification`, `AuditEvent`, `User`, `Role`, `Subscription`, `Invoice`, `ImpactReport`, `Assumption`, `PilotMetric`.

## 6. Business rules
* Forecast horizon is 7–14 days. Alerts state the window ("over 10 days").
* Every alert shows **why it fired** (signal contributions add up to 100%) and its data sources.
* Data is de-identified: no names, district-level aggregation, minimum cell size of 10, role-based access, and every view or export is audited.
* Labs and PHCs join free and receive benchmarks back. Hospitals pay a subscription by bed size; the first 3 months are free.
* Prices: < 100 beds $4,800 · 100–250 beds $9,600 · > 250 beds $18,000 / year. District licence (MoPH, insurers, donors) ≈ $40,000 / year. Data is never sold.
* MVP pass bar: 4/6 explain the alert, 4/6 name an action, average trust ≥ 4/5, 3/6 would pilot or share data.
* Alerts have a severity derived from expected rise and confidence: High ≥ 30% rise, Medium 15–30%, Low < 15%.
* Marsad positions itself as a partner to hospital IT and the Ministry, not a replacement (S8). It integrates with HIS vendors.

## 7. Out of scope for the prototype (production team)
Real authentication / SSO, backend APIs, HIS/LIS integration (HL7/FHIR), the forecasting models, the de-identification pipeline, email delivery, billing and payments, hosting. All of these are simulated on the frontend with realistic mock data.
