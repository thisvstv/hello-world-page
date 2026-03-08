import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/components/SettingsContext";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { NotificationProvider } from "@/components/NotificationSystem";
import { ProjectDataProvider } from "@/components/ProjectDataContext";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import { StealthProvider } from "@/components/StealthMode";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import Footer from "@/components/Footer";

// Lazy-loaded pages & layout for smaller initial bundle
const DashboardLayout = lazy(() => import("@/components/DashboardLayout"));
const Landing = lazy(() => import("./pages/Landing"));
const UserHome = lazy(() => import("./pages/UserHome"));
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/Auth"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ComingSoon = lazy(() => import("./pages/Landing"));
const AboutPage = lazy(() => import("./pages/About"));
const BlogPage = lazy(() => import("./pages/Blog"));
const CareersPage = lazy(() => import("./pages/Careers"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const TermsPage = lazy(() => import("./pages/Terms"));
const SecurityPage = lazy(() => import("./pages/Security"));
const FeaturesPage = lazy(() => import("./pages/Features"));
const ChangelogPage = lazy(() => import("./pages/Changelog"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmail"));
const GlobalCalendarPage = lazy(() => import("./pages/GlobalCalendar"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Wait for auth check to complete before redirecting
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.isVerified) return <Navigate to="/verify-email" replace />;
  return <>{children}</>;
}

function AuthRoute() {
  const { user, loading } = useAuth();

  // Wait for auth check to complete
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/home" replace />;
  return <AuthPage />;
}

/** Public route that never redirects — used for forgot/reset password pages */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

/** Show footer ONLY on public/marketing pages — hidden on all internal/workspace routes */
const PUBLIC_FOOTER_PATHS = ["/", "/about", "/blog", "/careers", "/privacy", "/terms", "/security", "/features", "/changelog", "/coming-soon"];

function ConditionalFooter() {
  const { pathname } = useLocation();
  const isPublic = PUBLIC_FOOTER_PATHS.includes(pathname);
  if (!isPublic) return null;
  return <Footer />;
}

function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/login" element={<AuthRoute />} />
            <Route path="/register" element={<AuthRoute />} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <UserHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Index />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Index />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <GlobalCalendarPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <ConditionalFooter />
    </div>
  );
}

const App = () => (
  <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PwaInstallBanner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <ProjectDataProvider>
                <SettingsProvider>
                  <CommandPaletteProvider>
                    <StealthProvider>
                      <ErrorBoundary>
                        <AppShell />
                      </ErrorBoundary>
                    </StealthProvider>
                  </CommandPaletteProvider>
                </SettingsProvider>
              </ProjectDataProvider>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </MotionConfig>
);

export default App;
