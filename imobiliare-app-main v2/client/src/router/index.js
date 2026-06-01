import { createRouter, createWebHistory } from "vue-router";
import store from "../store";

const Catalog = () => import("../views/Catalog.vue");
const Login = () => import("../views/Login.vue");
const Register = () => import("../views/Register.vue");
const PropertyDetails = () => import("../views/PropertyDetails.vue");

const DashboardRouter = () => import("../views/DashboardRouter.vue");
const Properties = () => import("../views/Properties.vue");
const AddProperty = () => import("../views/AddProperty.vue");
const Tenants = () => import("../views/Tenants.vue");
const Contracts = () => import("../views/Contracts.vue");
const Invoices = () => import("../views/Invoices.vue");
const InvoiceDetails = () => import("../views/InvoiceDetails.vue");
const Maintenance = () => import("../views/Maintenance.vue");
const Users = () => import("../views/Users.vue");

const MyContracts = () => import("../views/client/MyContracts.vue");
const MyInvoices = () => import("../views/client/MyInvoices.vue");
const MyMaintenance = () => import("../views/client/MyMaintenance.vue");

const routes = [
  // --- ZONA PUBLICĂ ---
  { path: "/", name: "Catalog", component: Catalog, meta: { layout: "public" } },
  { path: "/login", name: "Login", component: Login, meta: { layout: "public" } },
  { path: "/register", name: "Register", component: Register, meta: { layout: "public" } },
  { path: "/property/:id", name: "PropertyDetails", component: PropertyDetails, props: true, meta: { layout: "public" } },

  // --- ZONA INTERNĂ (sidebar) ---
  { path: "/app/dashboard", name: "Dashboard", component: DashboardRouter, meta: { layout: "app", requiresAuth: true } },

  // Angajați (admin/contabil/tehnic)
  { path: "/app/properties", name: "Properties", component: Properties, meta: { layout: "app", requiresAuth: true, roles: ["admin", "tehnic"] } },
  { path: "/app/properties/add", name: "AddProperty", component: AddProperty, meta: { layout: "app", requiresAuth: true, roles: ["admin"] } },
  { path: "/app/tenants", name: "Tenants", component: Tenants, meta: { layout: "app", requiresAuth: true, roles: ["admin", "contabil"] } },
  { path: "/app/contracts", name: "Contracts", component: Contracts, meta: { layout: "app", requiresAuth: true, roles: ["admin", "contabil"] } },
  { path: "/app/invoices", name: "Invoices", component: Invoices, meta: { layout: "app", requiresAuth: true, roles: ["admin", "contabil"] } },
  { path: "/app/invoices/:id", name: "InvoiceDetails", component: InvoiceDetails, props: true, meta: { layout: "app", requiresAuth: true } },
  { path: "/app/maintenance", name: "Maintenance", component: Maintenance, meta: { layout: "app", requiresAuth: true, roles: ["admin", "tehnic"] } },
  { path: "/app/users", name: "Users", component: Users, meta: { layout: "app", requiresAuth: true, roles: ["admin"] } },

  // Client (portal)
  { path: "/app/my-contracts", name: "MyContracts", component: MyContracts, meta: { layout: "app", requiresAuth: true, roles: ["client"] } },
  { path: "/app/my-invoices", name: "MyInvoices", component: MyInvoices, meta: { layout: "app", requiresAuth: true, roles: ["client"] } },
  { path: "/app/my-maintenance", name: "MyMaintenance", component: MyMaintenance, meta: { layout: "app", requiresAuth: true, roles: ["client"] } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters.isLoggedIn;
  const role = store.getters.userRole;

  if (to.meta.requiresAuth && !isLoggedIn) {
    return next("/login");
  }
  if (to.meta.roles && !to.meta.roles.includes(role)) {
    return next("/app/dashboard");
  }
  next();
});

export default router;
