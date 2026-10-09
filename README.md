# Marsad: frontend prototype

**AI-powered chronic disease surveillance & early warning for hospitals.**
This is a high-fidelity React + Vite prototype of the full system described in the *Marsad · Challenge 4* pitch deck. It is frontend-only: all data is synthetic, mocked locally and saved in the browser (localStorage), so the demo survives page refreshes.

## Run it

Requirements: Node.js 18+ (20 or 22 recommended).

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

* **Home page:** `/`
* **Login:** `/login`, username **`admin`**, password **`123456`**

Production build: `npm run build`, then `npm run preview`.

## What's inside

| Area | Route | Highlights |
|---|---|---|
| Home page | `/` | Problem, Connect → Detect → Act, AI, value proposition, comparison table, stakeholders, pricing |
| Login | `/login` | Validation, error state, loading state, demo-credential helper |
| Morning Brief | `/app/brief` | 2-minute brief: what's rising, KPIs, 14-day forecast, catchment risk map, stressors, suggested and due actions, email preview, **7:45 huddle mode** |
| National Overview | `/app/national` | MoPH view: national map, governorate table, weekly bulletin export |
| Alerts | `/app/alerts` | Filters, sort, table and card views, tabs, bulk acknowledge, CSV export |
| Why this alert? | `/app/alerts/:id` | Signal contributions, evidence and sparklines, forecast with alert window, action plan, trust feedback, model card, share, comments |
| Risk Map | `/app/map` | District choropleth by condition, age group, horizon and scope |
| Forecasts | `/app/forecasts` | 7/14-day forecasts with 80% intervals, per-condition small multiples, accuracy back-test |
| Early Signals | `/app/signals` | Anomaly detection on labs, refills and PHC no-shows; heat, power cuts, air quality, shortages |
| Action Plans | `/app/actions` | Kanban board (drag & drop) and list view, create, edit and delete actions |
| Readiness | `/app/readiness` | Beds (reserve for surge), medicine stock vs forecast (place orders), staff rota gaps |
| PHC Outreach | `/app/outreach` | De-identified call lists, log call outcomes, call scripts, audited phone reveal |
| Data Network | `/app/network` | Partners and feeds, permission toggles, re-sync of failed feeds, invite partner, agreement pipeline, data-flow diagram |
| Benchmarks | `/app/benchmarks` | Free benchmarks returned to labs and PHCs |
| Privacy & Audit | `/app/governance` | Compliance checklist, anonymisation rules (k-anonymity preview), role access matrix, audit log |
| Impact Reports | `/app/reports` | Quarterly and monthly reports, generate, publish, share, print to PDF |
| Pilot Program | `/app/pilot` | 90-day timeline, MVP pass criteria (live), assumption tracker, interview plan, the ask |
| Subscription | `/app/subscription` | Pricing tiers, pilot-to-paid flow, district licences, unit economics, TAM/SAM/SOM |
| Users & Roles | `/app/users` | Invite, change roles, suspend, MFA |
| Settings | `/app/settings` | Brief schedule and catchment, alert thresholds, notifications, reset demo data |

Global features: role switcher ("Viewing as", 8 stakeholder perspectives with role-based navigation and permissions), notifications centre, command palette (**Ctrl/⌘ + K**), toasts, loading skeletons, empty, error and not-found states, a responsive layout with a collapsible sidebar, and a print style.

## For the development team

* `docs/REQUIREMENTS_MAP.md`: every requirement, role, workflow, entity and business rule taken from the pitch deck, mapped to screens.
* `src/data/reference.js`: lookups, roles and the permission matrix (`NAV`), and pricing.
* `src/data/seed.js`: synthetic data and the generators for forecasts, signals and risk scores. These stand in for the real backend and models.
* `src/store/AppStore.jsx`: one reducer that holds every state transition (alert lifecycle, actions, outreach, partners, audit logging). It is a good blueprint for the API.
* The district shapes in `src/data/lebanonMap.js` are approximate, derived from the Natural Earth outline. Production should use official boundaries.

Stack: React 18, React Router 6, Tailwind CSS 3, Recharts, lucide-react, Vite 5.
