import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Trash2 } from 'lucide-react';

export function ZoneEditor() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [zones, setZones] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'heatmap'>('edit');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    api.get('/cameras').then(data => {
      setCameras(data);
      if (data.length > 0) setSelectedCamera(data[0].id);
    });
    api.get('/analytics/history').then(setHistory).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCamera) {
      api.get(`/cameras/${selectedCamera}/zones`).then(setZones).catch(console.error);
    }
  }, [selectedCamera]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPoints([...points, { x, y }]);
  };

  const handleSaveZone = async () => {
    if (points.length < 3 || !newZoneName) return alert('Need a name and at least 3 points');
    
    try {
      await api.post(`/cameras/${selectedCamera}/zones`, {
        name: newZoneName,
        camera_id: selectedCamera,
        polygon: points.map(p => [p.x, p.y]),
        color: '#8B5CF6'
      });
      setPoints([]);
      setNewZoneName('');
      api.get(`/cameras/${selectedCamera}/zones`).then(setZones);
    } catch (e) {
      alert("Failed to save zone");
    }
  };

  const deleteZone = async (zoneId: string) => {
    try {
      await api.delete(`/zones/${zoneId}?camera_id=${selectedCamera}`);
      api.get(`/cameras/${selectedCamera}/zones`).then(setZones);
    } catch (e) {
      alert("Failed to delete zone");
    }
  };

  // Draw on canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Calculate heatmap max visits
    const maxVisits = history.reduce((max, h) => Math.max(max, h.visits), 1);

    // Draw existing zones
    zones.forEach(zone => {
      if (!zone.polygon || zone.polygon.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(zone.polygon[0][0] * width, zone.polygon[0][1] * height);
      for (let i = 1; i < zone.polygon.length; i++) {
        ctx.lineTo(zone.polygon[i][0] * width, zone.polygon[i][1] * height);
      }
      ctx.closePath();
      
      let fillColor = zone.color || '#8B5CF6';
      let strokeColor = zone.color || '#8B5CF6';
      
      if (viewMode === 'heatmap') {
        const stats = history.find(h => h.zone_id === zone.id);
        const intensity = stats ? (stats.visits / maxVisits) : 0;
        // Heatmap color logic: Cold (blue) to Hot (red)
        const hue = (1 - intensity) * 240; // 240 is blue, 0 is red
        fillColor = `hsl(${hue}, 100%, 50%)`;
        strokeColor = fillColor;
      }
      
      ctx.fillStyle = viewMode === 'heatmap' ? fillColor : fillColor + '40'; // 25% opacity for edit
      ctx.globalAlpha = viewMode === 'heatmap' ? 0.6 : 1.0;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      const label = viewMode === 'heatmap' 
        ? `${zone.name} (${history.find(h => h.zone_id === zone.id)?.visits || 0} visits)`
        : zone.name;
      ctx.fillText(label, zone.polygon[0][0] * width + 5, zone.polygon[0][1] * height + 15);
    });
    
    // Draw current drawing points
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * width, points[i].y * height);
      }
      if (points.length > 2) ctx.closePath();
      
      ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
      if (points.length > 2) ctx.fill();
      
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw points
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.stroke();
      });
    }
  }, [points, zones]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Zone Editor & Heatmaps</h2>
          <p className="text-textMuted mt-1">Configure tracking areas and visualize shopper traffic.</p>
        </div>
        <div className="flex bg-background rounded-md p-1 border border-surfaceHighlight">
          <button 
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'edit' ? 'bg-surface text-white shadow' : 'text-textMuted hover:text-white'}`}
            onClick={() => setViewMode('edit')}
          >
            Edit Zones
          </button>
          <button 
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'heatmap' ? 'bg-surface text-white shadow' : 'text-textMuted hover:text-white'}`}
            onClick={() => setViewMode('heatmap')}
          >
            Heatmaps
          </button>
        </div>
      </div>

      <div className="mb-6">
        <select 
          value={selectedCamera} 
          onChange={e => setSelectedCamera(e.target.value)}
          className="bg-surface border border-surfaceHighlight rounded px-4 py-2 text-white min-w-[250px]"
        >
          {cameras.length === 0 && <option value="">No cameras available</option>}
          {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedCamera && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-surface p-4 rounded-lg border border-surfaceHighlight relative">
              {/* Fake video background for demo */}
              <div className="absolute inset-4 bg-background rounded border border-surfaceHighlight flex items-center justify-center text-textMuted">
                Video Feed Placeholder
              </div>
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={450} 
                onClick={handleCanvasClick}
                className="relative z-10 w-full h-auto cursor-crosshair border border-primary/20 rounded bg-transparent"
                style={{ aspectRatio: '16/9' }}
              />
            </div>
            <p className="text-sm text-textMuted mt-2">Click on the feed to draw a polygon. You need at least 3 points.</p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
              <h3 className="text-lg font-bold text-white mb-4">New Zone</h3>
              <input 
                value={newZoneName} 
                onChange={e => setNewZoneName(e.target.value)} 
                placeholder="e.g. Endcap Display A"
                className="w-full bg-background border border-surfaceHighlight rounded px-3 py-2 text-white mb-4"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveZone}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primaryHover disabled:opacity-50"
                  disabled={points.length < 3 || !newZoneName}
                >
                  Save Zone
                </button>
                <button 
                  onClick={() => setPoints([])}
                  className="px-4 py-2 bg-background border border-surfaceHighlight text-white rounded hover:bg-surfaceHighlight"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-surfaceHighlight">
              <h3 className="text-lg font-bold text-white mb-4">Existing Zones</h3>
              {zones.length === 0 && <p className="text-sm text-textMuted">No zones configured.</p>}
              <div className="space-y-3">
                {zones.map(z => (
                  <div key={z.id} className="flex items-center justify-between p-3 bg-background rounded border border-surfaceHighlight">
                    <div>
                      <p className="font-medium text-white">{z.name}</p>
                      <p className="text-xs text-textMuted">{z.polygon.length} points</p>
                    </div>
                    <button onClick={() => deleteZone(z.id)} className="text-danger p-2 hover:bg-surfaceHighlight rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
