'use client';

import { useState, useEffect } from 'react';

// --- CONFIGURATION ---
// Replace this with your actual Azure Function URL
const API_URL = "https://func-cs7080nm-api.azurewebsites.net/api/latest";

interface TelemetryData {
  deviceId: string;
  temperature: number;
  humidity: number;
  ts_device: number;
  ts_cloud: string;
}

export default function Dashboard() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false); // Live stream disabled by default
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();

      setData(result);
      setLastFetchTime(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch data once when the page first loads
  useEffect(() => {
    fetchTelemetry();
  }, []);

  // 2. Control the continuous polling based on the toggle state
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLive) {
      // Set up polling every 5 seconds if Live mode is ON
      intervalId = setInterval(fetchTelemetry, 5000);
    }

    // Cleanup interval when toggle is turned off or component unmounts
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive]);

  // --- Dynamic UI Helpers ---
  // These change the look of the dashboard based on the sensor values
  const getTempStyle = (temp: number) => {
    if (temp >= 30) return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: 'text-rose-500', icon: '🔥', status: 'High Heat' };
    if (temp <= 15) return { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', label: 'text-cyan-500', icon: '❄️', status: 'Cold' };
    return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'text-emerald-500', icon: '🌡️', status: 'Optimal' };
  };

  const getHumStyle = (hum: number) => {
    if (hum >= 60) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'text-blue-500', icon: '💧', status: 'High Humidity' };
    if (hum <= 30) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'text-amber-500', icon: '🏜️', status: 'Dry' };
    return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', label: 'text-teal-500', icon: '💦', status: 'Optimal' };
  };

  const tempStyle = data ? getTempStyle(data.temperature) : null;
  const humStyle = data ? getHumStyle(data.humidity) : null;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans transition-colors duration-500">
      <div className="max-w-4xl mx-auto">

        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <header>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Environmental Monitor</h1>
            <p className="text-slate-500 mt-1 font-medium">CS7080NM Prototype</p>
          </header>

          <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto justify-between">
            <button
              onClick={fetchTelemetry}
              disabled={loading || isLive}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && !isLive ? 'Fetching...' : '🔄 Refresh'}
            </button>

            <div className="w-px h-8 bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-3 pr-2">
              <span className={`text-sm font-semibold transition-colors ${isLive ? 'text-emerald-600' : 'text-slate-400'}`}>
                Live Stream
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isLive}
                  onChange={() => setIsLive(!isLive)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r shadow-sm flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold">Connection Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Sensor Readings</h2>

            {isLive ? (
              <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">Streaming Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">Paused</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {!data ? (
              <div className="flex flex-col justify-center items-center h-48 text-slate-400 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
                <p>Waiting for telemetry data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Temperature Card - Dynamically Styled */}
                <div className={`${tempStyle?.bg} border ${tempStyle?.border} rounded-2xl p-6 transition-colors duration-500 relative shadow-sm`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-sm font-bold uppercase tracking-wider ${tempStyle?.label}`}>Temperature</span>
                    <span className="text-2xl drop-shadow-sm">{tempStyle?.icon}</span>
                  </div>
                  <div className={`text-6xl font-black ${tempStyle?.text} mb-4 tracking-tighter`}>
                    {data.temperature.toFixed(1)}<span className="text-4xl opacity-50 font-semibold tracking-normal">°C</span>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/60 shadow-sm ${tempStyle?.text}`}>
                    {tempStyle?.status}
                  </div>
                </div>

                {/* Humidity Card - Dynamically Styled */}
                <div className={`${humStyle?.bg} border ${humStyle?.border} rounded-2xl p-6 transition-colors duration-500 relative shadow-sm`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-sm font-bold uppercase tracking-wider ${humStyle?.label}`}>Humidity</span>
                    <span className="text-2xl drop-shadow-sm">{humStyle?.icon}</span>
                  </div>
                  <div className={`text-6xl font-black ${humStyle?.text} mb-4 tracking-tighter`}>
                    {data.humidity.toFixed(1)}<span className="text-4xl opacity-50 font-semibold tracking-normal">%</span>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/60 shadow-sm ${humStyle?.text}`}>
                    {humStyle?.status}
                  </div>
                </div>

                {/* Metadata Footer */}
                <div className="col-span-1 md:col-span-2 mt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span>📡 Source Device:</span>
                    <span className="text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm font-mono">
                      {data.deviceId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏱️ Last Update:</span>
                    <span className="text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                      {lastFetchTime ? lastFetchTime.toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}