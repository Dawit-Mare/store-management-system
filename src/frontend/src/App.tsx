import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { ActivityLog } from "./pages/ActivityLog";
import { Dashboard } from "./pages/Dashboard";
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

function AppShell() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

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
  component: UsersPage,
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
