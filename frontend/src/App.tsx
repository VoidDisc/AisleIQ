import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Activity, LayoutDashboard, Settings as SettingsIcon, Video } from 'lucide-react';

function App() {
  const [health, setHealth] = useState<string>('checking...');

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => setHealth(data.status))
      .catch(() => setHealth('disconnected'));
  }, []);

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
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-textMuted hover:bg-surfaceHighlight hover:text-text transition-colors">
              <Video size={20} />
              <span>Cameras</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-textMuted hover:bg-surfaceHighlight hover:text-text transition-colors">
              <SettingsIcon size={20} />
              <span>Settings</span>
            </a>
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
            <p className="text-textMuted mt-1">Monitor real-time shopper analytics.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat Cards */}
            <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
              <h3 className="text-sm font-medium text-textMuted mb-2">Total Visits Today</h3>
              <p className="text-3xl font-bold text-white">---</p>
            </div>
            <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
              <h3 className="text-sm font-medium text-textMuted mb-2">Avg. Dwell Time</h3>
              <p className="text-3xl font-bold text-white">---</p>
            </div>
            <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
              <h3 className="text-sm font-medium text-textMuted mb-2">Active Cameras</h3>
              <p className="text-3xl font-bold text-white">0 / 0</p>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
