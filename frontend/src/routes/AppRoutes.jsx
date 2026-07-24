import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';
import Dashboard from '../pages/Dashboard';
import Campaigns from '../pages/Campaigns';
import ICP from '../pages/ICP';
import Leads from '../pages/Leads';
import EmailDrafts from '../pages/EmailDrafts';
import Analytics from '../pages/Analytics';
import Login from '../pages/Login';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Main Application Layout Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/icp" element={<ICP />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/email-drafts" element={<EmailDrafts />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      {/* Fallback wildcard redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
