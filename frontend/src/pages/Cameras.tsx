import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Play, Square, Trash2, Plus } from 'lucide-react';

export function Cameras() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCam, setNewCam] = useState({ name: '', source_type: 'local', source_path: '' });

  const fetchCameras = () => {
    api.get('/cameras').then(setCameras).catch(console.error);
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/cameras', newCam);
      setShowAdd(false);
      setNewCam({ name: '', source_type: 'local', source_path: '' });
      fetchCameras();
    } catch (e) {
      alert("Failed to add camera");
    }
  };

  const action = async (id: string, act: string) => {
    try {
      await api.post(`/cameras/${id}/${act}`);
      fetchCameras();
    } catch (e) {
      alert(`Failed to ${act} camera`);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this camera?")) return;
    try {
      await api.delete(`/cameras/${id}`);
      fetchCameras();
    } catch (e) {
      alert("Failed to delete camera");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Camera Management</h2>
          <p className="text-textMuted mt-1">Configure and control video sources.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primaryHover transition-colors"
        >
          <Plus size={18} /> Add Camera
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-surface p-6 rounded-lg border border-surfaceHighlight mb-8 space-y-4">
          <h3 className="text-lg font-bold text-white">Add New Camera</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-textMuted mb-1">Name</label>
              <input required value={newCam.name} onChange={e => setNewCam({...newCam, name: e.target.value})} className="w-full bg-background border border-surfaceHighlight rounded px-3 py-2 text-white" placeholder="Front Door" />
            </div>
            <div>
              <label className="block text-sm text-textMuted mb-1">Source Type</label>
              <select value={newCam.source_type} onChange={e => setNewCam({...newCam, source_type: e.target.value})} className="w-full bg-background border border-surfaceHighlight rounded px-3 py-2 text-white">
                <option value="local">Local Video</option>
                <option value="rtsp">RTSP Stream</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-textMuted mb-1">Source Path / URL</label>
              <input required value={newCam.source_path} onChange={e => setNewCam({...newCam, source_path: e.target.value})} className="w-full bg-background border border-surfaceHighlight rounded px-3 py-2 text-white" placeholder="../test_video.mp4" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-success text-white rounded-md hover:bg-success/90">Save</button>
        </form>
      )}

      <div className="space-y-4">
        {cameras.map(cam => (
          <div key={cam.id} className="bg-surface p-6 rounded-lg border border-surfaceHighlight flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{cam.name}</h3>
              <p className="text-sm text-textMuted mt-1">{cam.source_path}</p>
              <div className="flex gap-4 mt-3">
                <span className={`text-xs font-medium px-2 py-1 rounded bg-background ${cam.status === 'running' ? 'text-success' : 'text-textMuted'}`}>
                  {cam.status.toUpperCase()}
                </span>
                {cam.status === 'running' && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-background text-primary">
                    FPS: {cam.processing_fps.toFixed(1)}
                  </span>
                )}
                {cam.last_error && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-danger/10 text-danger">
                    Error: {cam.last_error}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {cam.status !== 'running' ? (
                <button onClick={() => action(cam.id, 'start')} className="p-2 bg-background border border-surfaceHighlight text-success rounded hover:bg-surfaceHighlight" title="Start Processing">
                  <Play size={18} />
                </button>
              ) : (
                <button onClick={() => action(cam.id, 'stop')} className="p-2 bg-background border border-surfaceHighlight text-warning rounded hover:bg-surfaceHighlight" title="Stop Processing">
                  <Square size={18} />
                </button>
              )}
              <button onClick={() => remove(cam.id)} className="p-2 bg-background border border-surfaceHighlight text-danger rounded hover:bg-surfaceHighlight" title="Delete Camera">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
