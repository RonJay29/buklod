import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage       from "./Components/auth/login";
import MainLayout     from "./MainPage/mainLayout";
import ProtectedRoute from "./Components/ProtectedRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><MainLayout page="Dashboard" /></ProtectedRoute>
        } />
        <Route path="/manage-devices" element={
          <ProtectedRoute><MainLayout page="Manage Devices" /></ProtectedRoute>
        } />
        <Route path="/device-data" element={
          <ProtectedRoute><MainLayout page="Device's Data" /></ProtectedRoute>
        } />
        <Route path="/ledger" element={
          <ProtectedRoute><MainLayout page="Ledger" /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><MainLayout page="Profile" /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}