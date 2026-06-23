import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle } from "lucide-react";

export default function TaskEntryNotificationModal({ open, onClose, onContinue }) {
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("amber");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadNotification();
    }
  }, [open]);

  const loadNotification = async () => {
    try {
      const settings = await base44.entities.GlobalSettings.filter({
        setting_key: "task_entry_notification_message"
      });
      if (settings.length > 0) {
        setMessage(settings[0].setting_value || "");
      }
      
      const colorSettings = await base44.entities.GlobalSettings.filter({
        setting_key: "task_entry_notification_color"
      });
      if (colorSettings.length > 0) {
        setColor(colorSettings[0].setting_value || "amber");
      }
    } catch (e) {
      console.error("Error loading notification:", e);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = () => {
    const colorMap = {
      amber: "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500",
      orange: "bg-gradient-to-r from-orange-500 via-orange-600 to-red-500",
      red: "bg-gradient-to-r from-red-500 via-rose-500 to-pink-500",
      blue: "bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500",
      green: "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500",
      purple: "bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500",
      pink: "bg-gradient-to-r from-pink-500 via-rose-500 to-red-500"
    };
    return colorMap[color] || colorMap.amber;
  };

  const handleContinue = () => {
    onContinue();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full animate-in fade-in-50 zoom-in-95 duration-300">
        {/* Header Section with Gradient */}
        <div className={`${getColorClasses()} px-8 py-8`}>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 animate-pulse">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">📢 Official Notice</h2>
              <p className="text-white/90 text-sm font-medium mt-1">Important Information</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 py-10">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-200 border-t-amber-500"></div>
            </div>
          ) : (
            <>
              {/* Notice Content Box */}
              <div className="mb-8 relative">
                <div className="absolute -left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-xl p-8 border-2 border-amber-200">
                  <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {message || "Welcome to the Tasks section. Please read all instructions carefully before proceeding with your work."}
                  </p>
                </div>
              </div>

              {/* Attention Badge */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg px-4 py-4 mb-8">
                <p className="text-red-800 text-sm font-semibold">
                  ⚠️ Read carefully before proceeding. Your continued work indicates acceptance.
                </p>
              </div>

              {/* Continue Button - Full Width */}
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-0 cursor-pointer"
              >
                ✓ I Understand - Continue to Tasks
              </button>

              {/* Footer Text */}
              <p className="text-center text-gray-500 text-xs mt-6">
                You must click Continue to access the Tasks section
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
