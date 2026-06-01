# SANTA — modificări (Varianta A: extindere către sistemul de gestiune închirieri)

## Ce s-a adăugat (backend)

Schema extinsă printr-o migrare nouă (aditivă, nu strică datele existente):
`server/migrations/20260601120000_extend_schema_santa.js`
- `users`: + coloane `phone`, `active`; rolurile suportate: admin, contabil, tehnic, client
- `properties`: + coloane `sector`, `status` (FREE/RESERVED/OCCUPIED/MAINTENANCE)
- tabele noi: `tenants`, `contracts`, `invoices`, `maintenance_requests`

Module noi:
- `middleware/roles.js` — autorizare pe roluri: `requireRole("admin","contabil",...)`
- `utils/bnr.js` — curs valutar EUR/RON de la BNR (cu cache pe zi + valoare de rezervă)
- `services/invoiceService.js` — generare facturi, calcul TVA, marcare restanțe
- `jobs/scheduler.js` — cron: generare facturi lunare (02:00) + verificare scadențe (03:00)
- `routes/tenants.js` — chiriași (CRUD + ciclu de viață)
- `routes/contracts.js` — contracte (creare, activare, reziliere; tranziții de stare pe spațiu/chiriaș)
- `routes/invoices.js` — facturi (listă, generare, marcare plată, anulare, „ale mele")
- `routes/maintenance.js` — intervenții tehnice
- `routes/dashboard.js` — KPI pentru cele 4 dashboard-uri (admin/contabil/tehnic/client)

Modificate:
- `routes/properties.js` — filtre pe sector/status/categorie/căutare; câmpuri sector+status la creare
- `middleware/validation.js` — validare sector+status
- `app.js` — montare rute noi + pornire cron
- `server/package.json` — adăugat `axios` și `node-cron`

Seed demo nou: `server/seeds/z_demo_data.js`

## Conturi demo (după seed)

| Rol | Email | Parolă |
|-----|-------|--------|
| Admin | admin@santa.ro | admin123 |
| Contabil | contabil@santa.ro | contabil123 |
| Tehnic | tehnic@santa.ro | tehnic123 |
| Client | client@santa.ro | client123 |

## Cum rulezi

```bash
docker-compose up --build
# într-un alt terminal, după ce serverul a pornit:
docker exec -it imobiliare_server npx knex migrate:latest
docker exec -it imobiliare_server npx knex seed:run
```

Server: http://localhost:3000  ·  Client: http://localhost:5173

Test rapid backend (cu token de admin):
- POST /api/auth/login {email, password} → primești token
- GET /api/dashboard/admin (Authorization: Bearer <token>)
- GET /api/properties?sector=Sector%201&status=FREE
- POST /api/invoices/generate (admin/contabil)

## Ce urmează (frontend — pasul următor)

Backend-ul e complet. Mai trebuie construite, pe frontend (Vue 3 + Vuestic):
- extinderea store-ului Vuex și a router-ului pentru cele 4 roluri
- catalogul de spații cu filtru pe sectoare (pagina principală)
- cele 4 dashboard-uri (admin/contabil/tehnic/client)
- ecranele de chiriași, contracte, facturi (+ PDF), intervenții
- portalul de client (contractele/facturile mele, solicită intervenție)

---

## FRONTEND (adăugat — Vue 3 + Vuestic)

Structură nouă:
- `store/index.js` — extins cu getteri pe roluri (isAdmin/isContabil/isTehnic/isClient)
- `router/index.js` — zonă publică + zonă internă `/app/*` cu gardă pe roluri
- `App.vue` — alege layout-ul (public/app) după ruta curentă
- `layouts/PublicLayout.vue` — bară sus cu logo + buton Autentificare
- `layouts/AppLayout.vue` — sidebar lateral care se adaptează după rol
- `services/labels.js` — etichete + culori pentru toate stările (badge-uri)
- `components/Kpi.vue` — card de indicator reutilizabil

Pagini:
- `views/Catalog.vue` — catalog public de spații cu filtru pe sectoare
- `views/DashboardRouter.vue` + `views/dashboards/*` — cele 4 dashboard-uri (admin/contabil/tehnic/client)
- `views/Properties.vue`, `Tenants.vue`, `Contracts.vue`, `Invoices.vue`, `InvoiceDetails.vue`, `Maintenance.vue`, `Users.vue` — gestiune internă
- `views/client/*` — portal client (contractele mele, facturile mele, intervenții)
- `views/AddProperty.vue` — actualizat cu câmpul Sector

Endpoint nou backend: `GET /api/categories` (folosit de cataloage/formulare).

## Fluxuri de testat după pornire

1. Login `admin@santa.ro / admin123` → vezi tabloul de bord admin cu KPI.
2. Spații → vezi portofoliul; Chiriași → listă; Contracte → creează ciornă, apoi activează.
3. Facturi → „Generează facturi" → marchează una ca plătită; deschide o factură → Printează/PDF.
4. Intervenții → creează una, marchează „În lucru" / „Rezolvă".
5. Login `contabil@santa.ro` / `tehnic@santa.ro` / `client@santa.ro` → vezi că sidebar-ul și dashboard-ul diferă pe rol.
6. Pagina publică `/` (fără login) → catalogul cu filtru pe sectoare + buton Autentificare.
