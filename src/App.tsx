/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProductProvider } from "./contexts/ProductContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const ProductDNA = lazy(() => import("./pages/ProductDNA").then((m) => ({ default: m.ProductDNA })));
const Campaigns = lazy(() => import("./pages/Campaigns").then((m) => ({ default: m.Campaigns })));
const Creatives = lazy(() => import("./pages/Creatives").then((m) => ({ default: m.Creatives })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const Schedule = lazy(() => import("./pages/Schedule").then((m) => ({ default: m.Schedule })));
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const SharedCampaign = lazy(() => import("./pages/SharedCampaign").then((m) => ({ default: m.SharedCampaign })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Waitlist = lazy(() => import("./pages/Waitlist"));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="p-4 text-sm text-[#6b7280]">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Waitlist />} />
              <Route path="/login" element={<Login />} />
              <Route path="/waitlist" element={<Waitlist />} />
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
