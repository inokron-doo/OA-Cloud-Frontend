import "./App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";

import PublicRoute from "./routes/Public";
import PrivateRoute from "./routes/Private";

import { BarnProvider } from "./context/BarnContext";
import { Toaster } from "react-hot-toast";
import Layout from "./layout/Layout";

// import pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FeedingManagement = lazy(() => import("./pages/FeedingManagement"));
const Animals = lazy(() => import("./pages/Animals"));
const Setup = lazy(() => import("./pages/Setup"));
const Analysis = lazy(() => import("./pages/Analysis"));
const SignIn = lazy(() => import("./pages/Auth/SignIn"));
const Register = lazy(() => import("./pages/Auth/Register"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));
const Logout = lazy(() => import("./pages/Auth/Logout"));

function App() {
  return (
    <>
      <BarnProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
            <Routes>
              {/* Default Route: Agar user "/" par aaye */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Public Routes: Sirf non-logged-in users ke liye */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<SignIn />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Private Routes: Sirf logged-in users ke liye */}
              <Route element={<PrivateRoute />}>
                {/* Layout wrap karega in sab routes ko */}
                <Route element={<Layout><Outlet /></Layout>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/feeding-management" element={<FeedingManagement />} />
                  <Route path="/animals" element={<Animals />} />
                  <Route path="/setup" element={<Setup />} />
                  <Route path="/analysis" element={<Analysis />} />
                </Route>
              </Route>

              {/* 404 Page (Optional) */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </BarnProvider>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
