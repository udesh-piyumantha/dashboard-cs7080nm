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

  const fetchTelemetry = async () => {
    try {
      // Fetching from your Azure HTTP Function
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();

      // Update state with new data
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on load
    fetchTelemetry();

    // Set up polling every 5 seconds to match the ESP32 upload rate
    const intervalId = setInterval(fetchTelemetry, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-800">Environmental Safety Monitor</h1>
          <p className="text-slate-500 mt-2">CS7080NM Prototype - Real-Time Telemetry</p>
        </header>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm" role="alert">
            <p className="font-bold">Connection Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
          <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Live Sensor Readings</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-slate-300">Live</span>
            </div>
          </div>

          <div className="p-6">
            {loading && !data ? (
              <div className="flex justify-center items-center h-32 text-slate-400">
                <p>Connecting to Azure IoT Hub...</p>
              </div>
            ) : data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Temperature Card */}
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 flex flex-col items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-2">Temperature</span>
                  <div className="text-5xl font-bold text-slate-800">
                    {data.temperature.toFixed(1)}<span className="text-3xl text-slate-500">°C</span>
                  </div>
                </div>

                {/* Humidity Card */}
                <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100 flex flex-col items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-2">Humidity</span>
                  <div className="text-5xl font-bold text-slate-800">
                    {data.humidity.toFixed(1)}<span className="text-3xl text-slate-500">%</span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="col-span-1 md:col-span-2 mt-4 text-sm text-slate-500 bg-slate-50 p-4 rounded border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Device ID:</span> {data.deviceId}
                    </div>
                    <div>
                      <span className="font-semibold">Last Received (Cloud):</span>{' '}
                      {new Date(data.ts_cloud).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex justify-center items-center h-32 text-slate-400">
                <p>No telemetry data found. Start the Wokwi simulation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}