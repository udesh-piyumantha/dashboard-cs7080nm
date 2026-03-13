'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- CONFIGURATION ---
// Replace this with your actual Azure Function BASE URL (without /latest)
const API_BASE_URL = "https://func-cs7080nm-api.azurewebsites.net/api";

interface TelemetryData {
  id: string;
  deviceId: string;
  temperature: number;
  humidity: number;
  lightLevel: number;
  airQuality: number;
  alert: boolean;
  ts_device: number;
  ts_cloud: string;
}

export default function Dashboard() {
  const [historyData, setHistoryData] = useState<TelemetryData[]>([]);
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false); 
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      // Fetch the last 50 records for our history and charts
      const response = await fetch(`${API_BASE_URL}/history?limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result: TelemetryData[] = await response.json();
      
      if (result && result.length > 0) {
        setHistoryData(result);
        setData(result[0]); // The first item is the newest
      }
      
      setLastFetchTime(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isLive) {
      intervalId = setInterval(fetchTelemetry, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive]);

  // --- Dynamic UI Helpers ---
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

  const getAqiStyle = (aqi: number) => {
    if (aqi >= 150) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'text-red-500', icon: '😷', status: 'Poor' };
    if (aqi >= 50) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: 'text-yellow-500', icon: '😐', status: 'Moderate' };
    return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'text-green-500', icon: '🌿', status: 'Good' };
  };

  const getLightStyle = (light: number) => {
    if (light <= 20) return { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-100', label: 'text-slate-400', icon: '🌙', status: 'Dark' };
    return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: 'text-yellow-500', icon: '☀️', status: 'Bright' };
  };

  const tempStyle = data ? getTempStyle(data.temperature) : null;
  const humStyle = data ? getHumStyle(data.humidity) : null;
  const aqiStyle = data ? getAqiStyle(data.airQuality) : null;
  const lightStyle = data ? getLightStyle(data.lightLevel) : null;

  // Format data for Recharts (reverse to show oldest to newest left-to-right)
  const chartData = [...historyData].reverse().map(d => ({
    time: new Date(d.ts_cloud).toLocaleTimeString([], { hour12: false }),
    Temperature: d.temperature,
    Humidity: d.humidity,
    AirQuality: d.airQuality,
  }));

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        
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

        {/* Global Safety Alert Banner */}
        {data?.alert && (
          <div className="bg-red-500 text-white p-4 rounded-xl mb-6 shadow-lg animate-pulse flex items-center gap-4 border-2 border-red-700">
            <span className="text-4xl">🚨</span>
            <div>
              <h3 className="font-bold text-lg tracking-wide uppercase">Safety Alert Triggered</h3>
              <p className="text-red-100 text-sm">Environmental conditions have exceeded safe operating thresholds. Investigation required.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LATEST READINGS (Left Side - 2 columns on large screens) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Current Status</h2>
                {isLive ? (
                  <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
                )}
              </div>
              
              <div className="p-4 grid grid-cols-2 gap-4">
                {!data ? (
                  <div className="col-span-2 text-center text-slate-400 py-8">Loading...</div>
                ) : (
                  <>
                    {/* Temp */}
                    <div className={`${tempStyle?.bg} border ${tempStyle?.border} rounded-xl p-4 transition-colors duration-500 relative flex flex-col items-center justify-center text-center`}>
                      <span className="text-2xl mb-1">{tempStyle?.icon}</span>
                      <div className={`text-3xl font-black ${tempStyle?.text}`}>
                        {data.temperature.toFixed(1)}<span className="text-lg opacity-50">°C</span>
                      </div>
                      <span className={`text-xs font-bold uppercase mt-1 ${tempStyle?.label}`}>{tempStyle?.status}</span>
                    </div>

                    {/* Humidity */}
                    <div className={`${humStyle?.bg} border ${humStyle?.border} rounded-xl p-4 transition-colors duration-500 relative flex flex-col items-center justify-center text-center`}>
                      <span className="text-2xl mb-1">{humStyle?.icon}</span>
                      <div className={`text-3xl font-black ${humStyle?.text}`}>
                        {data.humidity.toFixed(1)}<span className="text-lg opacity-50">%</span>
                      </div>
                      <span className={`text-xs font-bold uppercase mt-1 ${humStyle?.label}`}>{humStyle?.status}</span>
                    </div>

                    {/* AQI */}
                    <div className={`${aqiStyle?.bg} border ${aqiStyle?.border} rounded-xl p-4 transition-colors duration-500 relative flex flex-col items-center justify-center text-center`}>
                      <span className="text-2xl mb-1">{aqiStyle?.icon}</span>
                      <div className={`text-3xl font-black ${aqiStyle?.text}`}>
                        {data.airQuality}
                      </div>
                      <span className={`text-xs font-bold uppercase mt-1 ${aqiStyle?.label}`}>AQI ({aqiStyle?.status})</span>
                    </div>

                    {/* Light */}
                    <div className={`${lightStyle?.bg} border ${lightStyle?.border} rounded-xl p-4 transition-colors duration-500 relative flex flex-col items-center justify-center text-center`}>
                      <span className="text-2xl mb-1">{lightStyle?.icon}</span>
                      <div className={`text-3xl font-black ${lightStyle?.text}`}>
                        {data.lightLevel.toFixed(0)}<span className="text-lg opacity-50">%</span>
                      </div>
                      <span className={`text-xs font-bold uppercase mt-1 ${lightStyle?.label}`}>{lightStyle?.status}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Metadata Footer */}
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                <span>ID: {data?.deviceId || 'N/A'}</span>
                <span>{lastFetchTime?.toLocaleTimeString() || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* HISTORICAL CHARTS (Right Side) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="bg-slate-800 px-6 py-4">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Historical Trend Analysis (Last 50 Readings)</h2>
              </div>
              <div className="p-6 flex-grow min-h-[400px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        tickMargin={10}
                        minTickGap={30}
                      />
                      <YAxis 
                        yAxisId="left" 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="Temperature" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="Humidity" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={false} 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="AirQuality" 
                        name="AQI" 
                        stroke="#eab308" 
                        strokeWidth={3} 
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full text-slate-400">
                    {loading ? 'Loading charts...' : 'No historical data available yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}