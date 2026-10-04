import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Settings as SettingsIcon, Video, Map, LayoutGrid, LogOut } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Cameras } from './pages/Cameras';
import { ZoneEditor } from './pages/ZoneEditor';
import { Settings } from './pages/Settings';
import { LiveView } from './pages/LiveView';
import { Login } from './pages/Login';
import { api } from './api/client';
import { useAuth, AuthProvider } from './context/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen bg-background flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <div className="h-screen bg-background flex items-center justify-center text-danger text-xl">Access Denied: Admins Only</div>;
  }

  return <>{children}</>;
}

function MainLayout() {
  const [health, setHealth] = useState<string>('checking...');
  const { user, logout } = useAuth();

  useEffect(() => {
    api.get('/health')
      .then((data: any) => setHealth(data.status))
      .catch(() => setHealth('disconnected'));
  }, []);

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
      isActive 
        ? 'bg-primary/10 text-primary' 
        : 'text-textMuted hover:bg-surfaceHighlight hover:text-text'
    }`;

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-surfaceHighlight p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8 text-primary">
          <Activity size={28} />
          <h1 className="text-xl font-bold text-white">AisleIQ</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavLink to="/" className={navClass}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/live" className={navClass}>
            <LayoutGrid size={20} />
            <span>Live Grid</span>
          </NavLink>
          <NavLink to="/cameras" className={navClass}>
            <Video size={20} />
            <span>Cameras</span>
          </NavLink>
          {user?.role === 'admin' && (
            <>
              <NavLink to="/zones" className={navClass}>
                <Map size={20} />
                <span>Zone Editor</span>
              </NavLink>
              <NavLink to="/settings" className={navClass}>
                <SettingsIcon size={20} />
                <span>Settings</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-surfaceHighlight">
          <div className="flex items-center justify-between mb-4 text-sm">
            <span className="text-textMuted flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success"></span> {user?.username} ({user?.role})</span>
            <button onClick={logout} className="text-textMuted hover:text-white" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-textMuted text-xs">
            <div className={`w-2 h-2 rounded-full ${health === 'ok' ? 'bg-success' : 'bg-danger'}`}></div>
            <span>Backend: {health}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<LiveView />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/zones" element={<ProtectedRoute requireAdmin><ZoneEditor /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
