import { createRouter, createWebHistory } from "vue-router";
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
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
  },
];

const router = createRouter({
  history: createWebHistory("/manowzab-sales/"),
  routes,
});

// Helper function to wait for Firebase Auth to initialize
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject,
    );
  });
};

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      next("/login");
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
