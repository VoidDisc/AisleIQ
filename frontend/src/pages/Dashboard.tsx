import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const [summary, setSummary] = useState({ total_visits: 0, average_dwell_time: 0 });
  const [cameras, setCameras] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const { data: wsData, connected } = useWebSocket('ws://localhost:8000/ws/live');

  useEffect(() => {
    // Initial fetch
    api.get('/analytics/summary').then(setSummary).catch(console.error);
    api.get('/cameras').then(setCameras).catch(console.error);
    api.get('/analytics/history').then(setHistory).catch(console.error);
  }, []);

  // Update from WebSocket
  useEffect(() => {
    if (wsData) {
      if (wsData.type === 'analytics_summary') {
        setSummary(wsData.data);
      } else if (wsData.type === 'cameras_update') {
        setCameras(wsData.data);
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
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${connected ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
          {connected ? 'Live' : 'Reconnecting...'}
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
          <h3 className="text-lg font-bold text-white mb-4">Camera Status</h3>
          <div className="space-y-4">
            {cameras.length === 0 && <p className="text-textMuted">No cameras configured.</p>}
            {cameras.map(cam => (
              <div key={cam.id} className="flex items-center justify-between p-4 bg-background rounded-md border border-surfaceHighlight">
                <div>
                  <p className="font-medium text-white">{cam.name}</p>
                  <p className="text-sm text-textMuted font-mono">{cam.id.split('-')[0]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">Status: <span className={cam.status === 'running' ? 'text-success' : 'text-warning'}>{cam.status}</span></p>
                  {cam.status === 'running' && (
                    <>
                      <p className="text-xs text-textMuted mt-1">FPS: {cam.processing_fps.toFixed(1)}</p>
                      <p className="text-xs text-textMuted">Tracks: {cam.active_tracks}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

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
      </div>
    </div>
  );
}
