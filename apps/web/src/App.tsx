import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { HomePage } from "./pages/Home";
import { StorePage } from "./pages/Store";
import { PlaceholderPage } from "./pages/Placeholder";

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
        <Route path="*" element={<PlaceholderPage page="notfound" />} />
      </Route>
    </Routes>
  );
}
