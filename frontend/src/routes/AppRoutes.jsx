import { Routes, Route } from "react-router-dom";

import Layout from "../components/layout/Layout";

import Dashboard from "../pages/Dashboard";
import CrimeMap from "../pages/CrimeMap";
import NetworkAnalysis from "../pages/NetworkAnalysis";
import DiurnalMatrix from "../pages/DiurnalMatrix";
import Officers from "../pages/Officers";
import InsightsForecast from "../pages/InsightsForecast";
import Reports from "../pages/Reports";
import ManageRecords from "../pages/ManageRecords";

import Login from "../pages/Login";
import Settings from "../pages/Settings";
import ProtectedRoute from "../components/auth/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Command Center Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/network-analysis" element={<NetworkAnalysis />} />
        <Route path="/network" element={<NetworkAnalysis />} />
        <Route path="/link-analysis" element={<NetworkAnalysis />} />
        <Route path="/spatiotemporal" element={<DiurnalMatrix />} />
        <Route path="/diurnal" element={<DiurnalMatrix />} />
        <Route path="/diurnal-matrix" element={<DiurnalMatrix />} />
        <Route path="/red-zones" element={<DiurnalMatrix />} />
        <Route path="/insights-forecast" element={<InsightsForecast />} />
        <Route path="/insights" element={<InsightsForecast />} />
        <Route path="/forecast" element={<InsightsForecast />} />
        <Route path="/assistant" element={<InsightsForecast />} />
        <Route path="/map" element={<CrimeMap />} />
        <Route path="/officers" element={<Officers />} />
        <Route path="/records" element={<ManageRecords />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;