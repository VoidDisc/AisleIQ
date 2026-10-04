import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Maximize, LayoutGrid } from 'lucide-react';

export function LiveView() {
  const [cameras, setCameras] = useState<any[]>([]);

  useEffect(() => {
    api.get('/cameras').then(setCameras).catch(console.error);
    const interval = setInterval(() => {
      api.get('/cameras').then(setCameras).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const runningCameras = cameras.filter(c => c.status === 'running');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Grid</h2>
          <p className="text-textMuted mt-1">Real-time multiplexed view of all active zones.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-surface border border-surfaceHighlight rounded text-white hover:bg-surfaceHighlight">
            <LayoutGrid size={18} />
          </button>
          <button className="p-2 bg-surface border border-surfaceHighlight rounded text-white hover:bg-surfaceHighlight">
            <Maximize size={18} />
          </button>
        </div>
      </div>

      {runningCameras.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface border border-surfaceHighlight rounded-lg">
          <p className="text-textMuted">No cameras currently running.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {runningCameras.map(cam => (
            <div key={cam.id} className="bg-surface rounded-lg border border-surfaceHighlight overflow-hidden">
              <div className="px-4 py-3 border-b border-surfaceHighlight flex justify-between items-center">
                <span className="font-medium text-white">{cam.name}</span>
                <span className="text-xs text-textMuted font-mono">FPS: {cam.processing_fps?.toFixed(1) || '0.0'}</span>
              </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
