import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Send } from "lucide-react";
import LiveActivityBar from "@/components/LiveActivityBar";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import TaskPreviewScreen from "@/components/TaskPreviewScreen";
import TaskTimeGuard from "@/components/TaskTimeGuard";
import TaskLockedScreen from "@/components/TaskLockedScreen";
import TaskRefreshWarning from "@/components/TaskRefreshWarning";
import { useTaskLock } from "@/lib/TaskLockContext";
import { getTaskLockStatus, setTaskLocked, buildVIPReportHeader, buildVIPReportFooter } from "@/lib/taskLockStorage";
import { useTaskActivityTracker } from "@/lib/useTaskActivityTracker";
import { startTaskActivity, stopTaskActivity, updateTaskActivity } from "@/lib/TaskActivityManager";
import { saveEntryWithChunking, retryBackupChunks } from "@/lib/chunkedDraftSaver";
import { useForceSubmitDetector } from "@/lib/useForceSubmitDetector";

const TOTAL = 35;
const REWARD = "₹100";
const TASK_DURATION = 8 * 60 * 60;

// Module-level ref so cleanup effect always sees latest value
let currentSessionId = null;

const FIELDS = [
  ["fullName", "Full Name"],
  ["phoneNumber", "Phone Number"],
  ["emailAddress", "Email Address"],
  ["aadharNumber", "Aadhar Number"],
  ["panNumber", "Pan Number"],
  ["qualification", "Qualification"],
  ["fullAddress", "Full Address"],
  ["city", "City"],
  ["state", "State"],
  ["pinCode", "Pin Code"],
  ["dob", "Dob"],
  ["gender", "Gender"],
  ["salary", "Salary"],
];

function createEntry(i) {
  const entry = { id: i + 1, isSaved: false, savedAt: null, timeTakenSeconds: null };
  FIELDS.forEach(([f]) => { entry[f] = ""; });
  return entry;
}

export default function DataEntry() {
  const taskSlot = parseInt(new URLSearchParams(window.location.search).get('task') || '1');
  const TASK_NAME = `Data Entry Task ${taskSlot}`;
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(TASK_DURATION);
  const [showPreview, setShowPreview] = useState(true);
  const [lockStatus, setLockStatus] = useState({ isLocked: false, lockUntil: null });
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const activityTrackerRef = useRef(null);

  const navigate = useNavigate();
  const { registerTask, unregisterTask, lockAndLeave } = useTaskLock();
  const { startTracking, stopTracking, markSave, pushLiveBarMetrics } = useTaskActivityTracker();

  // Refs to always have latest values inside event listeners & cleanup
  const startTimeRef = useRef(null);
  const entriesRef = useRef([]);
  const savedCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);
  const userRef = useRef(null);
  const taskActiveRef = useRef(false); // FIX: track if task is actually running
  const realTimeIntervalRef = useRef(null);
  const visibilityHandlerRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { entriesRef.current = entries; }, [entries]);
  useEffect(() => { savedCountRef.current = savedCount; }, [savedCount]);
  useEffect(() => { tabSwitchCountRef.current = tabSwitchCount; }, [tabSwitchCount]);
  useEffect(() => { userRef.current = user; }, [user]);

  // ─── Force Submit Detection (real-time) ───────────────────────────────────
  // When admin force-submits this user's task, stop the session and redirect
  useForceSubmitDetector(user, TASK_NAME, async () => {
    if (!taskActiveRef.current) return; // already stopped
    taskActiveRef.current = false;
    stopRealTimeUpdates();
    removeVisibilityHandler();
    if (currentSessionId) {
      try { await stopTaskActivity(currentSessionId, 'COMPLETED', { items_saved: savedCountRef.current }); } catch(e) {}
      currentSessionId = null;
    }
    sessionStorage.removeItem(`task_start_${TASK_NAME}`);
    sessionStorage.removeItem(`task_session_${TASK_NAME}`);
    sessionStorage.removeItem('workden_active_task_name');
    try { await stopTracking(true, false); } catch(e) {}

    // Show alert then redirect to Task History
    alert("📋 Your task has been submitted by an administrator. Please check your Task History.");
    setTimeout(() => {
      navigate('/SubmittedWork');
    }, 500);
  });

  // ─── Load user & initial state ───────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userSource = localStorage.getItem('workden_4_user_source');
        const savedUserId = localStorage.getItem('workden_4_login_id');
        if (userSource === 'appuser' && savedUserId) {
          const users = await base44.entities.AppUser.filter({ login_user_id: savedUserId });
          if (users?.length > 0) { setUser(users[0]); return; }
        }
        setUser(await base44.auth.me());
      } catch (e) {
        const saved = localStorage.getItem('workden_4_user');
        if (saved) setUser(JSON.parse(saved));
      }
    };
    loadUser();
    setEntries(Array.from({ length: TOTAL }, (_, i) => createEntry(i)));

    const ls = getTaskLockStatus(TASK_NAME);
    setLockStatus(ls);

    // Restore session if page was refreshed mid-task
    const savedStart = sessionStorage.getItem(`task_start_${TASK_NAME}`);
    if (savedStart && !ls.isLocked) {
      const t = parseInt(savedStart);
      setStartTime(t);
      startTimeRef.current = t;
      setShowPreview(false);
      setShowRefreshWarning(true);
      taskActiveRef.current = true;

      // Restore session id
      const savedSession = sessionStorage.getItem(`task_session_${TASK_NAME}`);
      if (savedSession) currentSessionId = savedSession;
    }

    // Cleanup on unmount
    return () => {
      stopRealTimeUpdates();
      removeVisibilityHandler();
    };
  }, []);

  // ─── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, TASK_DURATION - Math.floor((Date.now() - startTime) / 1000));
      setRemainingTime(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        taskActiveRef.current = false;
        alert("⏰ Time is over! Your 8-hour task time has ended. You can no longer edit or save.");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // ─── Real-time activity update (every 30s) ───────────────────────────────
  const startRealTimeUpdates = useCallback(() => {
    stopRealTimeUpdates(); // clear any existing interval
    realTimeIntervalRef.current = setInterval(async () => {
      if (!currentSessionId || !taskActiveRef.current) return;
      try {
        const now = Date.now();
        const elapsedSec = startTimeRef.current
          ? Math.floor((now - startTimeRef.current) / 1000)
          : 0;
        const saved = savedCountRef.current;
        const speed = elapsedSec > 0 ? ((saved / elapsedSec) * 3600).toFixed(1) : 0; // entries per hour

        await updateTaskActivity(currentSessionId, {
          items_saved: saved,
          tab_switches: tabSwitchCountRef.current,
          elapsed_seconds: elapsedSec,
          speed_per_hour: parseFloat(speed),
          task_content: `Data Entry - ${saved}/${TOTAL} entries completed`,
          status: 'active',
        });
      } catch (e) {
        console.warn('Real-time update failed:', e);
      }
    }, 30000); // every 30 seconds
  }, []);

  const stopRealTimeUpdates = useCallback(() => {
    if (realTimeIntervalRef.current) {
      clearInterval(realTimeIntervalRef.current);
      realTimeIntervalRef.current = null;
    }
  }, []);

  // ─── Tab visibility handler (FIX: only count, never abandon) ─────────────
  const setupVisibilityHandler = useCallback(() => {
    removeVisibilityHandler(); // remove old one first

    const handler = () => {
      if (!taskActiveRef.current) return;

      if (document.hidden) {
        // User switched away from tab — just COUNT it, do NOT abandon
        const newCount = tabSwitchCountRef.current + 1;
        setTabSwitchCount(newCount);
        tabSwitchCountRef.current = newCount;

        // Update DB with new tab switch count (non-blocking)
        if (currentSessionId) {
          updateTaskActivity(currentSessionId, {
            tab_switches: newCount,
            status: 'active', // KEEP as active, not abandoned
          }).catch(() => {});
        }
      }
      // When user comes BACK to tab — do nothing, task continues normally
    };

    document.addEventListener('visibilitychange', handler);
    visibilityHandlerRef.current = handler;
  }, []);

  const removeVisibilityHandler = useCallback(() => {
    if (visibilityHandlerRef.current) {
      document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }
  }, []);

  // ─── Unmount cleanup (FIX: only abandon if taskActive and not properly exited) ──
  useEffect(() => {
    return () => {
      unregisterTask();
      stopRealTimeUpdates();
      removeVisibilityHandler();

      // Only mark abandoned if task was running and not properly stopped
      if (taskActiveRef.current && currentSessionId) {
        const saved = savedCountRef.current;
        const behaviorData = {
          entries_completed: saved,
          items_saved: saved,
          tab_switches: tabSwitchCountRef.current,
          task_content: `Data Entry - ${saved}/${TOTAL} entries completed`,
        };
        stopTaskActivity(currentSessionId, 'ABANDONED', behaviorData).catch(() => {});
        stopTracking(false, true).catch(() => {});

        sessionStorage.removeItem(`task_start_${TASK_NAME}`);
        sessionStorage.removeItem(`task_session_${TASK_NAME}`);
        sessionStorage.removeItem('workden_active_task_name');
        currentSessionId = null;
        taskActiveRef.current = false;
      }
    };
  }, [stopTracking, unregisterTask, stopRealTimeUpdates, removeVisibilityHandler]);

  // ─── Start task ───────────────────────────────────────────────────────────
  const handleStart = async () => {
    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;
    taskActiveRef.current = true;

    sessionStorage.setItem(`task_start_${TASK_NAME}`, String(now));
    sessionStorage.setItem('workden_active_task_name', TASK_NAME);
    setShowPreview(false);

    // FIX: Start activity FIRST, get sessionId, then pass to tracker (no race condition)
    let sessionId = null;
    try {
      sessionId = await startTaskActivity(
        userRef.current?.id,
        userRef.current?.full_name || userRef.current?.email,
        TASK_NAME,
        'Data Entry'
      );
      currentSessionId = sessionId;
      sessionStorage.setItem(`task_session_${TASK_NAME}`, sessionId);
    } catch (e) {
      console.error('Failed to start activity:', e);
    }

    // Pass confirmed sessionId directly — no race condition
    startTracking(userRef.current, TASK_NAME, TASK_NAME, sessionId);

    // Start real-time 30s updates
    startRealTimeUpdates();

    // Setup tab switch detection (NOT abandon on switch)
    setupVisibilityHandler();

    registerTask(async () => {
      setTaskLocked(TASK_NAME);
      try {
        const lockUntil = new Date();
        lockUntil.setDate(lockUntil.getDate() + 1);
        lockUntil.setHours(7, 0, 0, 0);
        const existing = await base44.entities.ActiveTask.filter({ user_id: userRef.current?.id, status: 'active' });
        if (existing?.length > 0) {
          await base44.entities.ActiveTask.update(existing[0].id, {
            status: 'locked',
            locked_until: lockUntil.toISOString(),
            lock_reason: 'incomplete',
          });
        }
      } catch (e) {}
    });
  };

  // ─── Proper exit (user clicks back arrow with confirmation) ───────────────
  const handleExit = async () => {
    if (!window.confirm("⚠️ If you leave this task, it will be LOCKED until tomorrow 7:00 AM. Do you want to continue?")) {
      return;
    }

    taskActiveRef.current = false; // FIX: mark inactive BEFORE cleanup so unmount doesn't double-abandon
    stopRealTimeUpdates();
    removeVisibilityHandler();

    if (currentSessionId) {
      try {
        const saved = savedCountRef.current;
        const behaviorData = {
          entries_completed: saved,
          items_saved: saved,
          tab_switches: tabSwitchCountRef.current,
          task_content: `Data Entry - ${saved}/${TOTAL} entries completed`,
        };
        await stopTaskActivity(currentSessionId, 'STOPPED', behaviorData);
      } catch (e) {
        console.error('Failed to stop activity:', e);
      }
      currentSessionId = null;
    }

    sessionStorage.removeItem(`task_start_${TASK_NAME}`);
    sessionStorage.removeItem(`task_session_${TASK_NAME}`);
    sessionStorage.removeItem('workden_active_task_name');

    try {
      await stopTracking(false, true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {}

    lockAndLeave('/Tasks');
  };

  // ─── Field change ─────────────────────────────────────────────────────────
  const handleChange = (index, field, value) => {
    const e = [...entries];
    e[index][field] = value;
    setEntries(e);
  };

  // ─── Save entry with CHUNKING (500 char chunks, rate limited) ────────────
  const handleSave = async (index) => {
    if (remainingTime === 0) { alert("⏰ Time is over! You cannot save anymore."); return; }
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    if (h * 60 + m < 7 * 60 || h * 60 + m > 23 * 60 + 30) {
      alert("⚠️ Task submission is allowed only between 7:00 AM to 11:30 PM"); return;
    }
    if (!userRef.current?.id) { alert("⚠️ User session error. Please refresh the page."); return; }

    const entry = entries[index];
    if (!entry.fullName || !entry.phoneNumber || !entry.emailAddress) {
      alert("Please fill Full Name, Phone Number, and Email Address!"); return;
    }

    try {
      // Build content
      const content = FIELDS.map(([f, l]) => `${l}: ${entry[f] || 'N/A'}`).join('\n');
      
      // Save with chunking (splits into 500 char chunks automatically)
      const saveResult = await saveEntryWithChunking({
        user: userRef.current,
        workType: "Data Entry",
        entryData: entry,
        content: content,
        startTime: startTimeRef.current || startTime,
        taskId: entry.id
      });
      
      if (!saveResult.success) {
        alert(`⚠️ Saved ${saveResult.successful}/${saveResult.total_chunks} chunks. ${saveResult.failed} chunks saved locally as backup (will retry automatically).`);
      }

      const savedAt = Date.now();
      const timeTakenSeconds = startTimeRef.current
        ? Math.floor((savedAt - startTimeRef.current) / 1000)
        : null;

      const e = [...entries];
      e[index].isSaved = true;
      e[index].savedAt = savedAt;
      e[index].timeTakenSeconds = timeTakenSeconds;
      setEntries(e);

      const newSaved = savedCount + 1;
      setSavedCount(newSaved);
      savedCountRef.current = newSaved;
      markSave();

      // Immediate real-time update on save (don't wait 30s)
      if (currentSessionId) {
        const elapsedSec = startTimeRef.current
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : 0;
        const speed = elapsedSec > 0 ? ((newSaved / elapsedSec) * 3600).toFixed(1) : 0;
        updateTaskActivity(currentSessionId, {
          items_saved: newSaved,
          tab_switches: tabSwitchCountRef.current,
          elapsed_seconds: elapsedSec,
          speed_per_hour: parseFloat(speed),
          task_content: `Data Entry - ${newSaved}/${TOTAL} entries completed`,
          status: 'active',
        }).catch(() => {});
      }
    } catch (err) {
      alert("Failed to save. Please try again.");
    }
  };

  // ─── Submit Task ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const done = entries.filter(e => e.isSaved);
    if (!done.length) { alert("Save at least one entry before submitting!"); return; }
    if (!window.confirm(`Submit ${done.length} saved entries for review?`)) return;

    setSubmitting(true);
    try {
      const elapsedSec = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      // Build task_data with all filled entries (NO metadata fields like isSaved, savedAt, timeTakenSeconds)
      const taskData = done.map(e => {
        const obj = { id: e.id };
        FIELDS.forEach(([field, label]) => { obj[label] = e[field] || ''; });
        // Don't include isSaved, savedAt, timeTakenSeconds - these are UI-only fields
        return obj;
      });

      // Build item timing summary for behavior_data
      const itemTimings = done.map(e => ({
        item: e.id,
        time_seconds: e.timeTakenSeconds,
        suspicious: e.timeTakenSeconds !== null && e.timeTakenSeconds < 180
      }));

      // Force-sync latest metrics from LiveActivityBar right before reading
      const activity = activityTrackerRef.current || {};
      const liveMetrics = {
        chars_typed: activity.typedChars || 0,
        words: activity.words || 0,
        wpm: activity.wpm || 0,
        pasted_chars: activity.pastedChars || 0,
        paste_attempts: activity.pasteAttempts || 0,
        tab_switches: activity.tabSwitches || tabSwitchCount || 0,
        backspaces: activity.backspaces || 0,
        saved_count: done.length,
        total: TOTAL,
        item_timings: itemTimings,
        suspicious_items: itemTimings.filter(t => t.suspicious).length,
      };

      // Build content text and upload as file (avoid field size limit)
      let content = `${TASK_NAME}\nEntries Saved: ${done.length}/${TOTAL}\n\n`;
      done.forEach(e => {
        content += `--- Entry #${e.id} ---\n`;
        FIELDS.forEach(([field, label]) => { content += `${label}: ${e[field] || 'N/A'}\n`; });
        content += '\n';
      });

      // Upload full content as file
      let uploadedFileUrl = null;
      try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const file = new File([blob], `DataEntry_${Date.now()}.txt`, { type: 'text/plain' });
        const uploadResult = await base44.integrations.Core.UploadFile({ file: file });
        uploadedFileUrl = uploadResult?.file_url || null;
      } catch(e) { console.warn('File upload failed:', e); }

      // Store only a short summary in task_content to avoid size limit
      const shortSummary = `${TASK_NAME} | Entries: ${done.length}/${TOTAL} | Duration: ${Math.floor(elapsedSec/60)}m`;

      await base44.entities.Proof.create({
        user_id: userRef.current?.id,
        user_name: userRef.current?.full_name || userRef.current?.email,
        user_id_number: userRef.current?.login_user_id || userRef.current?.id,
        task_id: '',
        task_name: TASK_NAME,
        work_type: TASK_NAME,
        task_content: shortSummary,
        file_url: uploadedFileUrl,
        task_data: { entries: taskData.slice(0, 10) }, // store only first 10 to stay within limits
        csv_data: '',
        status: 'pending',
        submitted_date: new Date().toISOString(),
        reward_amount: 100,
        duration_seconds: elapsedSec,
        behavior_data: liveMetrics,
      });

      // Mark task complete — lock this slot so it never reappears
      setTaskLocked(TASK_NAME);
      taskActiveRef.current = false;
      stopRealTimeUpdates();
      removeVisibilityHandler();
      if (currentSessionId) {
        await stopTaskActivity(currentSessionId, 'COMPLETED', { items_saved: done.length });
        currentSessionId = null;
      }
      sessionStorage.removeItem(`task_start_${TASK_NAME}`);
      sessionStorage.removeItem(`task_session_${TASK_NAME}`);
      sessionStorage.removeItem('workden_active_task_name');
      await stopTracking(true, false);

      alert("✅ Task Submitted Successfully! You can check it in the Task History.");
      navigate('/Tasks');
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 60/30/15 minute alerts
  const timerAlertedRef = useRef({ m60: false, m30: false, m15: false });
  useEffect(() => {
    if (!startTime) return;
    const check = setInterval(() => {
      const remaining = Math.max(0, TASK_DURATION - Math.floor((Date.now() - startTime) / 1000));
      const mins = Math.floor(remaining / 60);
      if (mins <= 60 && mins > 30 && !timerAlertedRef.current.m60) { timerAlertedRef.current.m60 = true; alert("⏰ Alert: Only 60 minutes left! Please complete and submit your task soon."); }
      else if (mins <= 30 && mins > 15 && !timerAlertedRef.current.m30) { timerAlertedRef.current.m30 = true; alert("⚠️ Alert: Only 30 minutes left! Hurry up and submit your task."); }
      else if (mins <= 15 && !timerAlertedRef.current.m15) { timerAlertedRef.current.m15 = true; alert("🚨 URGENT: Only 15 minutes left! Submit your task immediately."); }
    }, 30000);
    return () => clearInterval(check);
  }, [startTime]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  // ─── Screens ──────────────────────────────────────────────────────────────
  if (lockStatus.isLocked) {
    return (
      <TaskLockedScreen
        taskName={TASK_NAME}
        lockUntil={lockStatus.lockUntil}
        onBack={() => navigate(createPageUrl("Tasks"))}
      />
    );
  }

  if (showPreview) {
    return (
      <TaskTimeGuard>
        <TaskPreviewScreen
          taskName="Data Entry"
          reward={REWARD}
          total={TOTAL}
          fields={FIELDS}
          onStart={handleStart}
          onBack={() => navigate(createPageUrl("Tasks"))}
        />
      </TaskTimeGuard>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Refresh warning overlay */}
      {showRefreshWarning && (
        <TaskRefreshWarning
          taskName={TASK_NAME}
          onContinue={() => setShowRefreshWarning(false)}
          onExit={() => {
            setShowRefreshWarning(false);
            sessionStorage.removeItem(`task_start_${TASK_NAME}`);
            lockAndLeave('/Tasks');
          }}
        />
      )}

      {/* Top Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExit}
          className="rounded-full border"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-purple-700">Data Entry</h1>
          {/* FIX: Show tab switch count so admin can see it */}
          {tabSwitchCount > 0 && (
            <p className="text-xs text-orange-500">Tab switches: {tabSwitchCount}</p>
          )}
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-mono font-bold ${
          remainingTime === 0
            ? 'bg-red-600 text-white'
            : remainingTime < 3600
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {remainingTime === 0
            ? '⏰ TIME OVER'
            : `⏱ ${String(Math.floor(remainingTime / 3600)).padStart(2, '0')}:${String(Math.floor((remainingTime % 3600) / 60)).padStart(2, '0')}:${String(remainingTime % 60).padStart(2, '0')}`
          }
        </div>

        <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl">
          {savedCount}/{TOTAL}
        </div>
      </div>

      {/* Live Activity Bar */}
      <LiveActivityBar
        startTime={startTime}
        savedCount={savedCount}
        total={TOTAL}
        trackerRef={activityTrackerRef}
        onMetricsUpdate={pushLiveBarMetrics}
      />

      {/* Entry Items */}
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
            {/* Item Header */}
            <div className={`flex items-center justify-between px-5 py-4 text-white font-semibold ${
              index % 2 === 0
                ? 'bg-gradient-to-r from-purple-700 to-purple-500'
                : 'bg-gradient-to-r from-blue-500 to-teal-400'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 bg-white/25 rounded-full flex items-center justify-center font-bold text-base">
                  {entry.id}
                </span>
                <span className="text-lg font-bold">Item #{entry.id}</span>
              </div>
              {!entry.isSaved ? (
                <Button
                  onClick={() => handleSave(index)}
                  size="sm"
                  className="bg-white/20 hover:bg-white/35 text-white border border-white/40 font-semibold px-4 py-2 h-auto rounded-xl"
                >
                  <Save className="w-4 h-4 mr-1.5" />Save
                </Button>
              ) : (
                <span className="text-sm bg-green-500 px-4 py-1.5 rounded-full font-semibold">✓ Saved</span>
              )}
            </div>

            {/* Item Fields */}
            <div className="bg-white p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FIELDS.map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label} *</label>
                    <textarea
                      placeholder="Type here..."
                      value={entry[field]}
                      onChange={e => {
                        handleChange(index, field, e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      disabled={entry.isSaved}
                      rows={1}
                      className="w-full border border-gray-200 focus:border-purple-400 text-base bg-white rounded-lg px-3 py-2 resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-60 disabled:bg-gray-50"
                      style={{ fontSize: '16px', minHeight: '44px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Submit Task Button */}
        <div className="pt-4 pb-8">
          <Button
            onClick={handleSubmit}
            disabled={savedCount === 0 || submitting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 text-base rounded-xl shadow-lg h-auto disabled:opacity-40"
          >
            <Send className="w-5 h-5 mr-2" />
            {submitting ? 'Submitting...' : `Submit Task (${savedCount} entries saved)`}
          </Button>
          {savedCount === 0 && (
            <p className="text-center text-xs text-gray-400 mt-2">Save at least one entry to submit</p>
          )}
        </div>
      </div>
    </div>
  );
}
