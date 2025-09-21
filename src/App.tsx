import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContractorsList from './pages/ContractorsList';
import HelpersList from './pages/EmployeesList';
import HelperForm from './pages/EmployeeForm';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import LoginPage from './pages/Login';
import Settings from './pages/Settings';
import IDCardGenerator from './pages/IDCardGenerator';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { session } = useAuth();

  return (
    <DataProvider>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <LoginPage />} />
        
        <Route 
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="contractors" element={<ContractorsList />} />
          <Route path="helpers" element={<HelpersList />} />
          <Route path="helpers/new" element={<HelperForm />} />
          <Route path="helpers/:id" element={<HelperForm />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="id-card" element={<IDCardGenerator />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

export default App;
