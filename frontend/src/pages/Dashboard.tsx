import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

export function Dashboard() {
  const [summary, setSummary] = useState({ total_visits: 0, average_dwell_time: 0 });
  const [cameras, setCameras] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h'>('all');
  const { data: wsData, connected } = useWebSocket('ws://localhost:8000/ws/live');

  useEffect(() => {
    // Initial fetch
    const hoursParam = timeFilter === '24h' ? '?hours=24' : '';
    api.get(`/analytics/summary${hoursParam}`).then(setSummary).catch(console.error);
    api.get('/cameras').then(setCameras).catch(console.error);
    api.get(`/analytics/history${hoursParam}`).then(setHistory).catch(console.error);
    api.get('/alerts').then(setAlerts).catch(console.error);
  }, [timeFilter]);
  const resolveAlert = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/api/alerts/${id}/resolve`, { method: 'PUT' });
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Initial fetch
    api.get('/analytics/summary').then(setSummary).catch(console.error);
    api.get('/cameras').then(setCameras).catch(console.error);
    api.get('/analytics/history').then(setHistory).catch(console.error);
    api.get('/alerts').then(setAlerts).catch(console.error);
  }, []);

  // Update from WebSocket
  useEffect(() => {
    if (wsData) {
      if (wsData.type === 'analytics_summary') {
        setSummary(wsData.data || wsData.payload);
      } else if (wsData.type === 'cameras_update') {
        setCameras(wsData.data || wsData.payload);
      } else if (wsData.type === 'new_alert') {
        setAlerts(prev => [(wsData.data || wsData.payload), ...prev].slice(0, 20));
      }
    }
  }, [wsData]);

  const activeCameras = cameras.filter(c => c.status === 'running').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          <p className="text-textMuted mt-1">Monitor real-time shopper analytics.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="bg-background border border-surfaceHighlight text-white text-sm rounded px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="24h">Last 24 Hours</option>
          </select>
          <a 
            href="http://localhost:8000/api/export/visits.csv" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-surfaceHighlight text-sm font-medium text-white rounded hover:bg-surfaceHighlight transition-colors"
          >
            <Download size={16} /> Export CSV
          </a>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${connected ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
            {connected ? 'Live' : 'Reconnecting...'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
          <h3 className="text-sm font-medium text-textMuted mb-2">Total Zone Visits</h3>
          <p className="text-3xl font-bold text-white">{summary.total_visits}</p>
        </div>
        <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
          <h3 className="text-sm font-medium text-textMuted mb-2">Avg. Dwell Time</h3>
          <p className="text-3xl font-bold text-white">{summary.average_dwell_time.toFixed(1)}s</p>
        </div>
        <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
          <h3 className="text-sm font-medium text-textMuted mb-2">Active Cameras</h3>
          <p className="text-3xl font-bold text-white">{activeCameras} / {cameras.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
          <h3 className="text-lg font-bold text-white mb-4">Live Camera Feeds</h3>
          <div className="space-y-4">
            {cameras.length === 0 && <p className="text-textMuted">No cameras configured.</p>}
            {cameras.map(cam => (
              <div key={cam.id} className="bg-background rounded-md border border-surfaceHighlight overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-surfaceHighlight">
                  <div>
                    <p className="font-medium text-white">{cam.name}</p>
                    <p className="text-sm text-textMuted font-mono">{cam.id.split('-')[0]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">Status: <span className={cam.status === 'running' ? 'text-success' : 'text-warning'}>{cam.status}</span></p>
                    {cam.status === 'running' && (
                      <p className="text-xs text-textMuted mt-1">FPS: {cam.processing_fps.toFixed(1)} | Tracks: {cam.active_tracks}</p>
                    )}
                  </div>
                </div>
                {cam.status === 'running' && (
                  <div className="relative aspect-video bg-black flex items-center justify-center">
                    <img 
                      src={`http://localhost:8000/api/stream/${cam.id}`} 
                      alt={`Live feed from ${cam.name}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                      <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                      LIVE
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
            <h3 className="text-lg font-bold text-white mb-4">Zone Visits</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                  <XAxis dataKey="zone_id" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="visits" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
            <h3 className="text-lg font-bold text-danger mb-4">Active Alerts</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {alerts.length === 0 && <p className="text-textMuted text-sm">No recent alerts.</p>}
              {alerts.map(alert => (
                <div key={alert.id} className="p-3 bg-danger/10 border border-danger/20 rounded-md flex items-center justify-between group">
                  <div>
                    <p className="text-sm text-white font-medium">{alert.message}</p>
                    <span className="text-xs text-textMuted">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-textMuted hover:text-white transition-opacity"
                    title="Resolve Alert"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
