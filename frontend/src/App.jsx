import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import PatientDashboard from './pages/PatientDashboard';
import LabDashboard from './pages/LabDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import api from './utils/api';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard if they try to access an unauthorized route
    switch (user.role) {
      case 'admin': return <Navigate to="/admin" replace />;
      case 'doctor': return <Navigate to="/doctor" replace />;
      case 'receptionist': return <Navigate to="/receptionist" replace />;
      case 'patient': return <Navigate to="/patient" replace />;
      case 'lab': return <Navigate to="/lab" replace />;
      case 'pharmacy': return <Navigate to="/pharmacy" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return children;
};

function App() {
  useEffect(() => {
    // Proactively ping the Render backend to wake it up from potential cold start
    const warmUpBackend = async () => {
      try {
        await api.get('/auth/ping');
      } catch (error) {
        // Silently ignore ping errors since it is only a wake-up ping
      }
    };
    warmUpBackend();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/doctor" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/receptionist" element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <ReceptionistDashboard />
          </ProtectedRoute>
        } />

        <Route path="/patient" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } />

        <Route path="/lab" element={
          <ProtectedRoute allowedRoles={['lab']}>
            <LabDashboard />
          </ProtectedRoute>
        } />

        <Route path="/pharmacy" element={
          <ProtectedRoute allowedRoles={['pharmacy']}>
            <PharmacyDashboard />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
