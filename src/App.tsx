/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { ProductDNA } from "./pages/ProductDNA";
import { Campaigns } from "./pages/Campaigns";
import { Creatives } from "./pages/Creatives";
import { Settings } from "./pages/Settings";
import { Schedule } from "./pages/Schedule";
import { Login } from "./pages/Login";
import { SharedCampaign } from "./pages/SharedCampaign";
import AdminDashboard from "./pages/AdminDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProductProvider } from "./contexts/ProductContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shared/:campaignId" element={<SharedCampaign />} />
            <Route element={<ProtectedRoute />}>
              <Route
                path="/dashboard"
                element={
                  <ProductProvider>
                    <Layout />
                  </ProductProvider>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dna" element={<ProductDNA />} />
                <Route path="creatives" element={<Creatives />} />
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
