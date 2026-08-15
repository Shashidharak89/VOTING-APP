import { useState } from "react";
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Vote from "./pages/Vote";
import CandidateRegister from "./pages/CandidateRegister";
import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import AdminSettings from "./components/AdminSettings";
import AdminRegistrations from "./components/AdminRegistrations";
import Analytics from "./components/Analytics";
import AdminVotedUsers from "./components/AdminVotedUsers";
import AdminPositions from "./components/AdminPositions";
import logo from "./assets/samca_logo.png";
import ViewCandidates from "./pages/ViewCandidates";
import { useEffect } from "react";

function App() {
  const [userEmail, setUserEmail] = useState(null);
  const [token, setToken] = useState(null);
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => {
    try {
      return localStorage.getItem("adminAuthed") === "true";
    } catch {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAdminAuthed(false);
      try {
        localStorage.removeItem("adminAuthed");
        localStorage.removeItem("adminPassword");
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("admin-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("admin-unauthorized", handleUnauthorized);
  }, []);

  const handleLogin = (email, jwt) => {
    setUserEmail(email);
    setToken(jwt);
  };
  const handleAdminLogin = () => {
    setIsAdminAuthed(true);
    try {
      localStorage.setItem("adminAuthed", "true");
    } catch {
      /* ignore storage errors */
    }
    const from = (location.state && location.state.from) || "/samca2k26-admin";
    navigate(from, { replace: true });
  };
  const handleAdminLogout = () => {
    setIsAdminAuthed(false);
    try {
      localStorage.removeItem("adminAuthed");
      localStorage.removeItem("adminPassword");
    } catch {
      /* ignore storage errors */
    }
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-light-bg">
      {/* Hide navbar on voting page for distraction-free full screen */}
      {location.pathname !== "/vote" && (
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-primary-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-primary-200 shadow-sm">
                  <img src="/samca_logo.jpeg" className="w-full h-full object-cover" alt="SAMCA Logo" />
                </div>
                <span className="font-bold text-xl text-text-primary">SAMCA Election</span>
              </Link>

              <nav className="hidden md:flex items-center space-x-8">
                <Link
                to="/view-candidates"
                className="block text-text-secondary hover:text-primary-800 font-medium transition-colors py-2 px-2 rounded-lg hover:bg-primary-50"
                onClick={() => setIsMobileMenuOpen(false)}>
               View Candidates
              </Link>
                <Link
                  to="/register"
                  className="text-text-secondary hover:text-primary-800 font-medium transition-colors">
                  Register
                </Link>
                <Link to="/vote" className="text-text-secondary hover:text-primary-800 font-medium transition-colors">
                  Vote
                </Link>
                {isAdminAuthed && (
                  <>
                    <Link
                      to="/samca2k26-admin"
                      className="text-primary-800 font-semibold transition-colors hover:text-accent-600">
                      Admin Panel
                    </Link>
                    <button
                      onClick={handleAdminLogout}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                      Admin Logout
                    </button>
                  </>
                )}
              </nav>


              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="bg-white text-text-secondary hover:text-primary-800 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && location.pathname !== "/vote" && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-16 left-0 right-0 z-50 bg-white shadow-lg border-b border-primary-100">
            <nav className="px-4 py-4 space-y-3">
               <Link
                to="/view-candidates"
                className="block text-text-secondary hover:text-primary-800 font-medium transition-colors py-2 px-2 rounded-lg hover:bg-primary-50"
                onClick={() => setIsMobileMenuOpen(false)}>
               View Candidates
              </Link>
              <Link
                to="/register"
                className="block text-text-secondary hover:text-primary-800 font-medium transition-colors py-2 px-2 rounded-lg hover:bg-primary-50"
                onClick={() => setIsMobileMenuOpen(false)}>
                Register
              </Link>
              <Link
                to="/vote"
                className="block text-text-secondary hover:text-primary-800 font-medium transition-colors py-2 px-2 rounded-lg hover:bg-primary-50"
                onClick={() => setIsMobileMenuOpen(false)}>
                Vote
              </Link>
              {isAdminAuthed && (
                <>
                  <Link
                    to="/samca2k26-admin"
                    className="block text-primary-800 font-medium hover:text-accent-600 transition-colors py-2 px-2 rounded-lg hover:bg-primary-50"
                    onClick={() => setIsMobileMenuOpen(false)}>
                    Admin Panel
                  </Link>
                  <button
                    onClick={() => {
                      handleAdminLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left bg-red-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                    Admin Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<CandidateRegister />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/view-candidates" element={<ViewCandidates />} />
          <Route
            path="/vote"
            element={
              userEmail ? (
                <Vote
                  userEmail={userEmail}
                  token={token}
                  onVoted={() => {
                    setUserEmail(null);
                    setToken(null);
                  }}
                />
              ) : (
                <Navigate to="/login" replace state={{ from: "/vote" }} />
              )
            }
          />
          <Route path="/admin-login" element={<AdminLogin onAdminLogin={handleAdminLogin} />} />
          {/* Admin protected routes */}
          <Route
            path="/samca2k26-admin"
            element={
              isAdminAuthed ? (
                <AdminLayout />
              ) : (
                <Navigate to="/admin-login" replace state={{ from: location.pathname }} />
              )
            }>
            <Route index element={<AdminSettings />} />
            <Route path="positions" element={<AdminPositions />} />
            <Route path="registrations" element={<AdminRegistrations />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="voted-users" element={<AdminVotedUsers />} />
            
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {location.pathname !== "/vote" && (
        <footer className="bg-primary-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border border-white/30 shadow-sm">
                  <img src="/samca_logo.jpeg" className="w-full h-full object-cover" alt="SAMCA Logo" />
                </div>
                <span className="font-semibold">SAMCA Election Portal</span>
              </div>
              <div className="text-sm text-primary-200">
                &copy; {new Date().getFullYear()} SAMCA Election Portal. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            SAMCA Election
            <span className="block text-accent-600">Portal 2026</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
            Your voice matters. Register as a candidate, explore available positions, and participate in shaping your
            student community's future.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl bg-primary-800 text-white shadow-lg hover:bg-white transform hover:scale-105 transition-all duration-200">
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Register as Candidate
            </Link>
            <Link
              to="/vote"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl bg-blue-600 text-white shadow-lg hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200">
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Vote Now
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-primary-100">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-3">Easy Registration</h3>
            <p className="text-text-secondary">
              Simple candidate registration process with photo upload and position selection.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-primary-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-3">Secure Voting</h3>
            <p className="text-text-secondary">OTP-based authentication ensures each student can vote once securely.</p>
          </div>

          <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-primary-100">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-primary-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-3">Real-time Results</h3>
            <p className="text-text-secondary">
              Track election progress with live analytics and transparent vote counting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-light-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <svg className="mx-auto h-24 w-24 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="mt-6 text-3xl font-bold text-text-primary">Page not found</h2>
          <p className="mt-2 text-sm text-text-secondary">Sorry, we couldn't find the page you're looking for.</p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-800 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500">
              Go back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
