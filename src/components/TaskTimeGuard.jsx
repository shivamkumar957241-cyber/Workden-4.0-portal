import React, { useState, useEffect } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export default function TaskTimeGuard({ children }) {
  const [now, setNow] = useState(new Date());
  const [istMismatch, setIstMismatch] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    // Check IST mismatch: fetch server time via a public API
    const checkIST = async () => {
      try {
        const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata');
        if (!res.ok) return;
        const data = await res.json();
        const serverTime = new Date(data.datetime);
        const localTime = new Date();
        const diffSeconds = Math.abs((serverTime - localTime) / 1000);
        if (diffSeconds > 300) setIstMismatch(true); // >5 minutes off
      } catch(e) {}
    };
    checkIST();
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const startMinutes = 7 * 60;       // 7:00 AM
  const endMinutes = 23 * 60 + 30;   // 11:30 PM

  const isAllowed = totalMinutes >= startMinutes && totalMinutes <= endMinutes;

  if (istMismatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white border-2 border-red-300 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-orange-600 pt-8 pb-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-xl font-black text-white text-center px-4">System Time Incorrect</h1>
          </div>
          <div className="p-6 text-center space-y-4">
            <p className="text-gray-700 text-sm font-semibold">⚠️ Your device's time does not match IST (Indian Standard Time).</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-800">Tasks cannot be opened when system time is wrong. Please update your device time to IST (UTC+5:30) and try again.</p>
            </div>
            <button onClick={() => window.location.reload()} className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again After Fixing Time
            </button>
            <Link to="/Tasks">
              <button className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl mt-2">← Back to Tasks</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAllowed) return children;

  // Calculate time until 7:00 AM next
  const nextStart = new Date(now);
  if (totalMinutes >= endMinutes) {
    nextStart.setDate(nextStart.getDate() + 1);
  }
  nextStart.setHours(7, 0, 0, 0);

  const diffMs = nextStart - now;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const hh = Math.floor(diffSec / 3600);
  const mm = Math.floor((diffSec % 3600) / 60);
  const ss = diffSec % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="bg-white border-2 border-orange-200 rounded-3xl shadow-2xl overflow-hidden">

          {/* Icon */}
          <div className="bg-gradient-to-br from-orange-400 to-amber-500 pt-8 pb-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Tasks Currently Locked</h1>
          </div>

          <div className="p-6 text-center space-y-5">
            <p className="text-gray-500 text-sm">Tasks are available between</p>
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-lg px-6 py-3 rounded-full inline-block shadow-lg">
              7:00 AM – 11:30 PM
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Next Tasks Unlock In</p>
              <div className="flex items-center justify-center gap-2">
                {[
                  { val: String(hh).padStart(2,'0'), label: 'HRS' },
                  { val: String(mm).padStart(2,'0'), label: 'MIN' },
                  { val: String(ss).padStart(2,'0'), label: 'SEC' },
                ].map((item, i) => (
                  <React.Fragment key={item.label}>
                    <div className="flex flex-col items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-3xl w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                        {item.val}
                      </div>
                      <p className="text-xs text-gray-400 font-semibold mt-1">{item.label}</p>
                    </div>
                    {i < 2 && <span className="text-2xl font-black text-orange-400 mb-4">:</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <p className="text-gray-400 text-xs">Please come back during task hours to start working.</p>

            <Link to="/Tasks">
              <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg mt-2">
                <RefreshCw className="w-4 h-4" />
                Go Back to Tasks
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
