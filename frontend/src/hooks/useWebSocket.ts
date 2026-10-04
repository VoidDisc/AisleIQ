import { useEffect, useState, useRef } from 'react';

export function useWebSocket(url: string) {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let timeoutId: number;

    const connect = () => {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {
          console.error("WebSocket parse error", e);
        }
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Exponential backoff or simple timeout to reconnect
        timeoutId = window.setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    };

    connect();

    return () => {
      clearTimeout(timeoutId);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  return { data, connected };
}
