
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import ScannerPage from './pages/ScannerPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/events" 
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/scanner" 
          element={
            <ProtectedRoute>
              <ScannerPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/events" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
