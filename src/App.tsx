import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";

import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import OnboardingPage from "@/pages/OnboardingPage";
import WalkthroughPage from "@/pages/WalkthroughPage";
import ResearchPage from "@/pages/ResearchPage";
import NotesPage from "@/pages/NotesPage";
import DocumentPage from "@/pages/DocumentPage";
import NotFound from "@/pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/plan/:planId/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/plan/:planId/build" element={<ProtectedRoute><WalkthroughPage /></ProtectedRoute>} />
          <Route path="/plan/:planId/research" element={<ProtectedRoute><ResearchPage /></ProtectedRoute>} />
          <Route path="/plan/:planId/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
          <Route path="/plan/:planId/document" element={<ProtectedRoute><DocumentPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="bottom-right" />
    </AuthProvider>
  );
}
