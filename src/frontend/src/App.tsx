import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { useAuth } from "./hooks/useAuth";
import { ActivityLog } from "./pages/ActivityLog";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { UsersPage } from "./pages/UsersPage";
import { Visitors } from "./pages/Visitors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

// ─── Users Route Guard ────────────────────────────────────────────────────────

function UsersGuard() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  if (role !== "SuperAdmin" && role !== "Admin") {
    // Users cannot access /users — silently redirect to dashboard
    throw redirect({ to: "/" });
  }
  return <UsersPage />;
}

// ─── Router ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: AppShell,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const visitorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/visitors",
  component: Visitors,
});

const logRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/log",
  component: ActivityLog,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UsersGuard,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  visitorsRoute,
  logRoute,
  usersRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
