import { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import ProtectedRoute from './components/ProtectedRoute';
import RhinoServiceForm from './components/RhinoServiceForm';
import DispatcherTechnicianMap from './components/DispatcherTechnicianMap';
import AdminAuditInbox from './components/AdminAuditInbox';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppShell() {
  const { user, login, logout } = useAuth();
  const [activeView, setActiveView] = useState('service');

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Rhino Field Ops</h1>
        <div className="topbar-actions">
          <button onClick={() => setActiveView('service')}>Service Form</button>
          <button onClick={() => setActiveView('dispatch')}>Dispatch Map</button>
          <button onClick={() => setActiveView('audit')}>Audit Inbox</button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="content">
        {activeView === 'service' && <RhinoServiceForm />}
        {activeView === 'dispatch' && <DispatcherTechnicianMap />}
        {activeView === 'audit' && <AdminAuditInbox />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    </AuthProvider>
  );
}
