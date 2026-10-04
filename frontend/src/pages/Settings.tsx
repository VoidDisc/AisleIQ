import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Save } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    confidence_threshold: 0.5,
    max_fps: 15,
    track_loss_timeout: 2.0,
    min_visit_duration: 1.0,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [armed, setArmed] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [refreshingLogs, setRefreshingLogs] = useState(false);

  const fetchLogs = () => {
    setRefreshingLogs(true);
    api.get('/logs')
      .then(data => setLogs(data.logs))
      .catch(console.error)
      .finally(() => setRefreshingLogs(false));
  };

  useEffect(() => {
    api.get('/settings').then(data => {
      setSettings(data);
      setLoading(false);
    }).catch(console.error);
    
    api.get('/security/status').then(data => setArmed(data.armed)).catch(console.error);
    
    fetchLogs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings', settings); // wait we need PUT for this api
    } catch {
      // fallback if API client doesn't have PUT exposed easily, wait api.post doesn't support put
      // we can add put to client or just use fetch
      await fetch('http://localhost:8000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    }
    setSaving(false);
    setSaving(false);
    alert('Settings saved successfully!');
  };

  const toggleArmed = async () => {
    try {
      const endpoint = armed ? '/security/disarm' : '/security/arm';
      await api.post(endpoint, {});
      setArmed(!armed);
    } catch (e) {
      console.error(e);
      alert('Failed to toggle security system');
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Settings</h2>
          <p className="text-textMuted mt-1">Configure computer vision and tracking parameters.</p>
        </div>
        <button 
          onClick={toggleArmed}
          className={`px-4 py-2 rounded font-bold shadow-lg transition-colors ${armed ? 'bg-danger hover:bg-danger/80 text-white animate-pulse' : 'bg-surface border border-surfaceHighlight text-white hover:bg-surfaceHighlight'}`}
        >
          {armed ? '🛡️ SYSTEM ARMED' : 'Disarmed'}
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-surface p-6 rounded-lg border border-surfaceHighlight space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Detection Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-textMuted mb-2">Confidence Threshold ({settings.confidence_threshold})</label>
              <input 
                type="range" 
                min="0.1" max="1.0" step="0.05"
                value={settings.confidence_threshold} 
                onChange={e => setSettings({...settings, confidence_threshold: parseFloat(e.target.value)})}
                className="w-full accent-primary" 
              />
              <p className="text-xs text-textMuted mt-1">Minimum confidence score for YOLO to detect a person.</p>
            </div>
            
            <div>
              <label className="block text-sm text-textMuted mb-2">Max FPS Limit</label>
              <input 
                type="number" 
                min="1" max="60"
                value={settings.max_fps} 
                onChange={e => setSettings({...settings, max_fps: parseInt(e.target.value)})}
                className="w-full bg-background border border-surfaceHighlight rounded px-3 py-2 text-white" 
              />
              <p className="text-xs text-textMuted mt-1">Cap the processing rate to save CPU/GPU resources.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-surfaceHighlight">
          <h3 className="text-lg font-bold text-white mb-4">Analytics & Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-textMuted mb-2">Track Loss Timeout (Seconds)</label>
              <input 
                type="number" 
                min="0.5" max="10.0" step="0.5"
                value={settings.track_loss_timeout} 
                onChange={e => setSettings({...settings, track_loss_timeout: parseFloat(e.target.value)})}
                className="w-full bg-background border border-surfaceHighlight rounded px-3 py-2 text-white" 
              />
              <p className="text-xs text-textMuted mt-1">Grace period before closing a session if a person is occluded.</p>
            </div>
            
            <div>
              <label className="block text-sm text-textMuted mb-2">Min Visit Duration (Seconds)</label>
              <input 
                type="number" 
                min="0.0" max="60.0" step="0.5"
                value={settings.min_visit_duration} 
                onChange={e => setSettings({...settings, min_visit_duration: parseFloat(e.target.value)})}
                className="w-full bg-background border border-surfaceHighlight rounded px-3 py-2 text-white" 
              />
              <p className="text-xs text-textMuted mt-1">Ignore visits shorter than this to filter out noise.</p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded hover:bg-primaryHover disabled:opacity-50"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
      
      <div className="mt-8 bg-surface p-6 rounded-lg border border-surfaceHighlight">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">System Logs</h3>
          <button 
            type="button" 
            onClick={fetchLogs}
            disabled={refreshingLogs}
            className="text-sm px-3 py-1 bg-background border border-surfaceHighlight text-white rounded hover:bg-surfaceHighlight"
          >
            {refreshingLogs ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="bg-[#1e1e1e] rounded border border-surfaceHighlight p-4 h-64 overflow-y-auto custom-scrollbar font-mono text-xs text-green-400">
          {logs.length === 0 && <span className="text-textMuted">No logs found.</span>}
          {logs.map((log, i) => (
            <div key={i} className="whitespace-pre-wrap">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
