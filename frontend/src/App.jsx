import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReceptionPage from './pages/ReceptionPage';
import DoctorPage from './pages/DoctorPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reception" element={<ReceptionPage />} />
      <Route path="/doctor" element={<DoctorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
