import { createRouter, createWebHashHistory } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import MainLayout from "../layouts/MainLayout.vue";
import DashboardView from "../views/DashboardView.vue";
import TransferView from "../views/TransferView.vue";
import ImportCODView from "../views/ImportCODView.vue";
import LoginView from "../views/LoginView.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        component: DashboardView,
      },
      {
        path: "transfer",
        name: "Transfer",
        component: TransferView,
      },
      {
        path: "import-cod",
        name: "ImportCOD",
        component: ImportCODView,
      },
      {
        path: "customers",
        name: "Customers",
        component: () => import("../views/CustomersView.vue"),
      },
      {
        path: "customer/:name",
        name: "CustomerDetail",
        component: () => import("../views/CustomerDetailView.vue"),
        props: true,
      },
      {
        path: "all-sales",
        name: "AllSales",
        component: () => import("../views/AllSalesView.vue"),
      },
      {
        path: "expenses",
        name: "Expenses",
        component: () => import("../views/ExpensesView.vue"),
      },
      {
        path: "compare",
        name: "CompareSales",
        component: () => import("../views/CompareSalesView.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// Singleton helper function to wait for initial Firebase Auth state once
let authInitialized = false;
const waitForAuth = () => {
  if (authInitialized) return Promise.resolve(auth.currentUser);
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        authInitialized = true;
        unsubscribe();
        resolve(user);
      },
      reject,
    );
  });
};

router.beforeEach(async (to, from, next) => {
  const currentUser = await waitForAuth();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !currentUser) {
    next("/login");
  } else if (to.path === "/login" && currentUser) {
    next("/");
  } else {
    next();
  }
});

export default router;
