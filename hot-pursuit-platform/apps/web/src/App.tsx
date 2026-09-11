import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { HomePage } from "./pages/Home";
import { StorePage } from "./pages/Store";
import { ServerPage } from "./pages/Server";
import { ApplicationsPage } from "./pages/Applications";
import { CommunityPage } from "./pages/Community";
import { MediaPage } from "./pages/Media";
import { RulesPage } from "./pages/Rules";
import { NewsPage } from "./pages/News";
import { LeaderboardsPage } from "./pages/Leaderboards";
import { SupportPage } from "./pages/Support";
import { MyOrdersPage } from "./pages/Orders";
import { OrderDetailPage } from "./pages/OrderDetail";
import { PlaceholderPage } from "./pages/Placeholder";
import { AdminLayout } from "./features/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminsPage } from "./pages/admin/Admins";
import { AdminOrdersPage } from "./pages/admin/Orders";
import { AdminProductsPage } from "./pages/admin/Products";
import { AdminComingSoon } from "./pages/admin/ComingSoon";
import { RequireAdmin } from "./features/auth/RequireAdmin";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="store/:category" element={<StorePage />} />
        <Route path="server" element={<ServerPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="leaderboards" element={<LeaderboardsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="profile" element={<PlaceholderPage page="profile" />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route
            path="applications"
            element={<AdminComingSoon moduleKey="adminApplications" />}
          />
          <Route path="tickets" element={<AdminComingSoon moduleKey="adminTickets" />} />
          <Route path="news" element={<AdminComingSoon moduleKey="pgNews" />} />
          <Route path="media" element={<AdminComingSoon moduleKey="pgMedia" />} />
          <Route path="players" element={<AdminComingSoon moduleKey="adminPlayers" />} />
          <Route path="server" element={<AdminComingSoon moduleKey="adminServer" />} />
          <Route path="settings" element={<AdminComingSoon moduleKey="adminSettings" />} />
          <Route path="*" element={<AdminComingSoon moduleKey="pgNews" />} />
        </Route>
        <Route path="*" element={<PlaceholderPage page="notfound" />} />
      </Route>
    </Routes>
  );
}
