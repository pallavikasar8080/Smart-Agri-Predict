import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';

type Page = 'login' | 'signup' | 'dashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('login');

  useEffect(() => {
    // Check for existing session
    const authStatus = localStorage.getItem('agroProfitAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('agroProfitAuth', 'true');
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('agroProfitAuth');
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  // Routing logic
  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (currentPage === 'signup') {
    return (
      <SignUp 
        onSignUp={handleLogin} 
        onNavigateToLogin={() => setCurrentPage('login')} 
      />
    );
  }

  // Default to Login
  return (
    <Login 
      onLogin={handleLogin} 
      onNavigateToSignUp={() => setCurrentPage('signup')} 
    />
  );
}