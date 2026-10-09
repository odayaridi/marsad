import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppStoreProvider, useStore } from './store/AppStore';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { ROLE_MAP } from './data/reference';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Brief from './pages/Brief';
import Alerts from './pages/Alerts';
import AlertDetail from './pages/AlertDetail';
import Actions from './pages/Actions';
import RiskMapPage from './pages/RiskMapPage';
import Forecasts from './pages/Forecasts';
import Signals from './pages/Signals';
import Readiness from './pages/Readiness';
import Outreach from './pages/Outreach';
import NetworkPage from './pages/NetworkPage';
import Benchmarks from './pages/Benchmarks';
import Governance from './pages/Governance';
import National from './pages/National';
import Reports from './pages/Reports';
import Subscription from './pages/Subscription';
import Pilot from './pages/Pilot';
import Users from './pages/Users';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';

function RequireAuth({ children }) {
  const { auth } = useStore();
  const location = useLocation();
  if (!auth) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function RoleHome() {
  const { role } = useStore();
  return <Navigate to={ROLE_MAP[role]?.home || '/app/brief'} replace />;
}

function AppRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<RoleHome />} />
          <Route path="brief" element={<Brief />} />
          <Route path="national" element={<National />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="alerts/:id" element={<AlertDetail />} />
          <Route path="map" element={<RiskMapPage />} />
          <Route path="forecasts" element={<Forecasts />} />
          <Route path="signals" element={<Signals />} />
          <Route path="actions" element={<Actions />} />
          <Route path="readiness" element={<Readiness />} />
          <Route path="outreach" element={<Outreach />} />
          <Route path="network" element={<NetworkPage />} />
          <Route path="benchmarks" element={<Benchmarks />} />
          <Route path="governance" element={<Governance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="pilot" element={<Pilot />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound inApp />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AppStoreProvider>
  );
}
