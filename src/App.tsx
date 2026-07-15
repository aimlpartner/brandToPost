/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { Waitlist } from "./pages/Waitlist";
import { Dashboard } from "./pages/Dashboard";
import { ProductDNA } from "./pages/ProductDNA";
import { Campaigns } from "./pages/Campaigns";
import { Scripts } from "./pages/Scripts";
import { Creatives } from "./pages/Creatives";
import { Settings } from "./pages/Settings";
import { Schedule } from "./pages/Schedule";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Onboarding } from "./pages/Onboarding";
import { SharedCampaign } from "./pages/SharedCampaign";
import { WhatsAppSystem } from "./pages/WhatsAppSystem";
import { WhatsAppLogin } from "./pages/WhatsAppLogin";
import { WhatsAppDashboard } from "./pages/WhatsAppDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { MasterFounder } from "./pages/MasterFounder";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { DnaDemo } from "./pages/DnaDemo";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProductProvider } from "./contexts/ProductContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { BlogList } from "./pages/BlogList";
import { BlogPost } from "./pages/BlogPost";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="" element={<LandingPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dna-demo" element={<DnaDemo />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/whatsapp/login" element={<WhatsAppLogin />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blogs" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/blogs/:slug" element={<BlogPost />} />
            <Route
              path="/whatsapp-system"
              element={
                <ProductProvider>
                  <WhatsAppDashboard />
                </ProductProvider>
              }
            />
            <Route
              path="/whatsapp/dashboard"
              element={
                <ProductProvider>
                  <WhatsAppDashboard />
                </ProductProvider>
              }
            />
            <Route path="/shared/:campaignId" element={<SharedCampaign />} />
            <Route element={<ProtectedRoute />}>
              <Route
                path="/onboarding"
                element={
                  <ProductProvider>
                    <Onboarding />
                  </ProductProvider>
                }
              />
              <Route path="/admin" element={<AdminDashboard />} />
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
                <Route path="scripts" element={<Scripts />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="master-founder" element={<MasterFounder />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<div className="p-8 text-white">Profile Page Coming Soon</div>} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
