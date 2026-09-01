import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { HomePage } from "./pages/Home";
import { StorePage } from "./pages/Store";
import { PlaceholderPage } from "./pages/Placeholder";
import { AdminLayout } from "./features/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminsPage } from "./pages/admin/Admins";
import { AdminComingSoon } from "./pages/admin/ComingSoon";
import { RequireAdmin } from "./features/auth/RequireAdmin";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="store/:category" element={<StorePage />} />
        <Route path="server" element={<PlaceholderPage page="server" />} />
        <Route path="applications" element={<PlaceholderPage page="applications" />} />
        <Route path="community" element={<PlaceholderPage page="community" />} />
        <Route path="media" element={<PlaceholderPage page="media" />} />
        <Route path="news" element={<PlaceholderPage page="news" />} />
        <Route path="leaderboards" element={<PlaceholderPage page="leaderboards" />} />
        <Route path="support" element={<PlaceholderPage page="support" />} />
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
          <Route path="store" element={<AdminComingSoon moduleKey="pgStore" />} />
          <Route path="orders" element={<AdminComingSoon moduleKey="adminOrders" />} />
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
