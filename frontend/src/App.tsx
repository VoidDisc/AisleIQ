import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, Settings as SettingsIcon, Video, Map } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Cameras } from './pages/Cameras';
import { ZoneEditor } from './pages/ZoneEditor';
import { api } from './api/client';

function App() {
  const [health, setHealth] = useState<string>('checking...');

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
    <BrowserRouter>
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
            <NavLink to="/cameras" className={navClass}>
              <Video size={20} />
              <span>Cameras</span>
            </NavLink>
            <NavLink to="/zones" className={navClass}>
              <Map size={20} />
              <span>Zone Editor</span>
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              <SettingsIcon size={20} />
              <span>Settings</span>
            </NavLink>
          </nav>

          <div className="mt-auto pt-4 border-t border-surfaceHighlight text-sm">
            <div className="flex items-center gap-2 text-textMuted">
              <div className={`w-2 h-2 rounded-full ${health === 'ok' ? 'bg-success' : 'bg-danger'}`}></div>
              <span>Backend: {health}</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cameras" element={<Cameras />} />
            <Route path="/zones" element={<ZoneEditor />} />
            <Route path="/settings" element={<div className="text-white">Settings Placeholder</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
