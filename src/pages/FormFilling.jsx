import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Send } from "lucide-react";
import LiveActivityBar from "@/components/LiveActivityBar";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TaskPreviewScreen from "@/components/TaskPreviewScreen";
import TaskTimeGuard from "@/components/TaskTimeGuard";
import TaskLockedScreen from "@/components/TaskLockedScreen";
import TaskRefreshWarning from "@/components/TaskRefreshWarning";
import { useTaskLock } from "@/lib/TaskLockContext";
import { getTaskLockStatus, setTaskLocked, buildVIPReportHeader, buildVIPReportFooter } from "@/lib/taskLockStorage";
import { useTaskActivityTracker } from "@/lib/useTaskActivityTracker";
import { startTaskActivity, stopTaskActivity } from "@/lib/TaskActivityManager";
import { saveEntryWithChunking, retryBackupChunks } from "@/lib/chunkedDraftSaver";
import { useForceSubmitDetector } from "@/lib/useForceSubmitDetector";

let currentSessionId = null;
const TOTAL = 30;
const REWARD = "₹100";
const TASK_DURATION = 8 * 60 * 60;

const FIELDS = [
  ["fullName", "Full Name"],
  ["emailAddress", "Email Address"],
  ["phoneNumber", "Phone Number"],
  ["alternatePhoneNumber", "Alternate Phone Number"],
  ["aadharNumber", "Aadhar Number"],
  ["panNumber", "Pan Number"],
  ["city", "City"],
  ["state", "State"],
  ["pinCode", "Pin Code"],
  ["dob", "Dob"],
  ["gender", "Gender"],
  ["nationality", "Nationality"],
  ["organizationCompanyName", "Organization Company Name"],
  ["totalExperienceYears", "Total Experience Years"],
  ["qualification", "Qualification"],
  ["maritalStatus", "Marital Status"],
];

function createForm(i) {
  const form = { id: i + 1, isSaved: false, fullAddress: "" };
  FIELDS.forEach(([f]) => { form[f] = ""; });
  return form;
}

export default function FormFilling() {
  const location = useLocation();
  const searchToUse = location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
  const taskSlot = parseInt(new URLSearchParams(searchToUse).get('task') || '1');
  const TASK_NAME = `Form Filling Task ${taskSlot}`;
  const [user, setUser] = useState(null);
  const [forms, setForms] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(TASK_DURATION);
  const [showPreview, setShowPreview] = useState(true);
  const [lockStatus, setLockStatus] = useState({ isLocked: false, lockUntil: null });
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const activityTrackerRef = useRef(null);
  const navigate = useNavigate();
  const { registerTask, unregisterTask, lockAndLeave } = useTaskLock();
  const { startTracking, stopTracking, markSave, pushLiveBarMetrics } = useTaskActivityTracker();
  const startTimeRef = useRef(null);
  const taskActiveRef = useRef(false);

  // ─── Force Submit Detection (real-time) ───────────────────────────────────
  useForceSubmitDetector(user, TASK_NAME, async () => {
    if (!taskActiveRef.current) return;
    taskActiveRef.current = false;
    if (currentSessionId) {
      try { await stopTaskActivity(currentSessionId, 'COMPLETED', { items_saved: forms.filter(f => f.isSaved).length }); } catch(e) {}
      currentSessionId = null;
    }
    sessionStorage.removeItem(`task_start_${TASK_NAME}`);
    sessionStorage.removeItem(`task_session_${TASK_NAME}`);
    sessionStorage.removeItem('workden_active_task_name');
    try { await stopTracking(true, false); } catch(e) {}
    alert("📋 Your task has been submitted by an administrator. Please check your Task History.");
    setTimeout(() => navigate('/SubmittedWork'), 500);
  });

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
    setForms(Array.from({ length: TOTAL }, (_, i) => createForm(i)));
    const ls = getTaskLockStatus(TASK_NAME);
    setLockStatus(ls);
    const savedStart = sessionStorage.getItem(`task_start_${TASK_NAME}`);
    if (savedStart && !ls.isLocked) {
      const t = parseInt(savedStart);
      setStartTime(t);
      startTimeRef.current = t;
      taskActiveRef.current = true;
      setShowPreview(false);
      setShowRefreshWarning(true);
    }
  }, []);

  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, TASK_DURATION - Math.floor((Date.now() - startTime) / 1000));
      setRemainingTime(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        alert("⏰ Time is over! Your 8-hour task time has ended. You can no longer edit or save.");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    return () => {
      unregisterTask();
      if (startTime && currentSessionId) {
         const behaviorData = {
           entries_completed: forms?.filter(f => f.isSaved).length || 0,
           items_saved: forms?.filter(f => f.isSaved).length || 0,
           task_content: `Form Filling - ${forms?.filter(f => f.isSaved).length || 0} forms completed`
         };
         stopTaskActivity(currentSessionId, 'ABANDONED', behaviorData).catch(() => {});
         stopTracking(false, true).catch(() => {});
          setTaskLocked(TASK_NAME); // Auto-lock on back
         sessionStorage.removeItem(`task_start_${TASK_NAME}`);
         sessionStorage.removeItem(`task_session_${TASK_NAME}`);
         sessionStorage.removeItem('workden_active_task_name');
         currentSessionId = null;
       }
    };
  }, [stopTracking, startTime, unregisterTask]);


  const handleStart = async () => {
    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;
    taskActiveRef.current = true;
    sessionStorage.setItem(`task_start_${TASK_NAME}`, now.toString());
    sessionStorage.setItem('workden_active_task_name', TASK_NAME);
    setShowPreview(false);

    console.log('🚀 Task Started:', { user: user?.id, userName: user?.full_name || user?.email, taskName: TASK_NAME });

    try {
      currentSessionId = await startTaskActivity(user?.id, user?.full_name || user?.email, TASK_NAME, 'Form Filling');
      console.log('📍 Session ID:', currentSessionId);
      sessionStorage.setItem(`task_session_${TASK_NAME}`, currentSessionId);
    } catch(e) {
      console.error('❌ Failed to start activity:', e);
    }

    // FIX #1: Pass sessionId directly to tracker — no race condition
    startTracking(user, TASK_NAME, TASK_NAME, currentSessionId);
    registerTask(async () => {
      setTaskLocked(TASK_NAME);
      try {
        const lockUntil = new Date();
        lockUntil.setDate(lockUntil.getDate() + 1);
        lockUntil.setHours(7, 0, 0, 0);
        const existing = await base44.entities.ActiveTask.filter({ user_id: user?.id, status: 'active' });
        if (existing?.length > 0) {
          await base44.entities.ActiveTask.update(existing[0].id, { status: 'locked', locked_until: lockUntil.toISOString(), lock_reason: 'incomplete' });
        }
      } catch(e) {}
    }, TASK_NAME);
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handleChange = (id, field, value) => {
    setForms(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleSave = async (form) => {
    if (remainingTime === 0) { alert("⏰ Time is over! You cannot save anymore."); return; }
    const now = new Date(); const h = now.getHours(), m = now.getMinutes();
    if (h * 60 + m < 7 * 60 || h * 60 + m > 23 * 60 + 30) {
      alert("⚠️ Task submission is allowed only between 7:00 AM to 11:30 PM"); return;
    }
    if (!user?.id) { alert("⚠️ User session error. Please refresh the page."); return; }
    if (!form.fullName || !form.emailAddress || !form.phoneNumber) {
      alert("⚠️ Please fill Full Name, Email, and Phone!"); return;
    }
    try {
      const content = [...FIELDS.map(([f, l]) => `${l}: ${form[f] || 'N/A'}`), `Full Address: ${form.fullAddress || 'N/A'}`].join('\n');
      
      // Save with chunking
      const saveResult = await saveEntryWithChunking({
        user: user,
        workType: "Form Filling",
        entryData: form,
        content: content,
        startTime: startTimeRef.current || startTime,
        taskId: form.id
      });
      
      if (!saveResult.success) {
        alert(`⚠️ Saved ${saveResult.successful}/${saveResult.total_chunks} chunks. ${saveResult.failed} chunks saved locally as backup.`);
      }
      
      setSavedCount(p => p + 1);
      setForms(prev => prev.map(f => f.id === form.id ? { ...f, isSaved: true } : f));
      markSave();
    } catch (e) { 
      console.error('Save error:', e);
      alert("❌ Failed to save. Please try again."); 
    }
  };

  const handleSubmit = async () => {
    const saved = forms.filter(f => f.isSaved);
    if (!saved.length) { alert("⚠️ No forms saved yet!"); return; }
    if (!window.confirm(`Submit ${saved.length} saved forms for review?`)) return;

    setSubmitting(true);
    try {
      const activity = activityTrackerRef.current || {};
      const elapsedSec = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      // Build task_data with NO metadata fields (isSaved should never be included)
      const taskData = saved.map(f => {
        const obj = { id: f.id };
        FIELDS.forEach(([field, label]) => { obj[label] = f[field] || ''; });
        obj['Full Address'] = f.fullAddress || '';
        // Don't include isSaved - it's a UI-only field
        return obj;
      });

      let content = `${TASK_NAME}\nForms Saved: ${saved.length}/${TOTAL}\n\n`;
      saved.forEach(f => {
        content += `--- Form #${f.id} ---\n`;
        FIELDS.forEach(([field, label]) => { content += `${label}: ${f[field] || 'N/A'}\n`; });
        content += `Full Address: ${f.fullAddress || 'N/A'}\n\n`;
      });

      // Upload content as a text file
      let uploadedFileUrl = null;
      try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const file = new File([blob], `FormFilling_${Date.now()}.txt`, { type: 'text/plain' });
        const uploadResult = await base44.integrations.Core.UploadFile({ file: file });
        uploadedFileUrl = uploadResult?.file_url || null;
      } catch(e) { console.warn('File upload failed:', e); }

      await base44.entities.Proof.create({
        user_id: user?.id,
        user_name: user?.full_name || user?.email,
        user_id_number: user?.login_user_id || user?.id,
        task_id: '',
        task_name: TASK_NAME,
        work_type: TASK_NAME,
        task_content: content,
        file_url: uploadedFileUrl,
        task_data: { forms: taskData },
        csv_data: JSON.stringify(taskData),
        status: 'pending',
        submitted_date: new Date().toISOString(),
        reward_amount: 100,
        duration_seconds: elapsedSec,
        behavior_data: {
          chars_typed: activity.typedChars || 0,
          words: activity.words || 0,
          wpm: activity.wpm || 0,
          pasted_chars: activity.pastedChars || 0,
          paste_attempts: activity.pasteAttempts || 0,
          tab_switches: activity.tabSwitches || 0,
          backspaces: activity.backspaces || 0,
          saved_count: saved.length,
          total: TOTAL,
        },
      });

      // Lock this slot so it never reappears
      setTaskLocked(TASK_NAME);
      if (currentSessionId) {
        await stopTaskActivity(currentSessionId, 'COMPLETED', { items_saved: saved.length }).catch(() => {});
        currentSessionId = null;
      }
      await stopTracking(true, false).catch(() => {});
      sessionStorage.removeItem(`task_start_${TASK_NAME}`);
      sessionStorage.removeItem(`task_session_${TASK_NAME}`);
      sessionStorage.removeItem('workden_active_task_name');

      alert("✅ Task Submitted Successfully! You can check it in the Task History.");
      navigate('/Tasks');
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (lockStatus.isLocked) {
    return <TaskLockedScreen taskName={TASK_NAME} lockUntil={lockStatus.lockUntil} onBack={() => navigate(createPageUrl("Tasks"))} />;
  }

  if (showPreview) {
    return (
      <TaskTimeGuard>
        <TaskPreviewScreen
          taskName={TASK_NAME}
          reward={REWARD}
          total={TOTAL}
          fields={FIELDS}
          onStart={handleStart}
          onBack={() => navigate(createPageUrl("Tasks"))}
        />
      </TaskTimeGuard>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {showRefreshWarning && (
        <TaskRefreshWarning
          taskName={TASK_NAME}
          onContinue={() => setShowRefreshWarning(false)}
          onExit={() => { setShowRefreshWarning(false); lockAndLeave('/Tasks'); }}
        />
      )}
      {/* Top Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <Button variant="ghost" size="icon" onClick={async () => {
          if (window.confirm("⚠️ If you leave this task, it will be LOCKED until tomorrow 7:00 AM. Do you want to continue?")) {
            if (currentSessionId) {
              try {
                const behaviorData = {
                   entries_completed: forms.filter(f => f.isSaved).length,
                   items_saved: forms.filter(f => f.isSaved).length,
                   task_content: `Form Filling - ${forms.filter(f => f.isSaved).length} forms completed`
                 };
                 await stopTaskActivity(currentSessionId, 'STOPPED', behaviorData);
              } catch(e) { console.error('Failed to stop activity:', e); }
              currentSessionId = null;
            }
            sessionStorage.removeItem(`task_start_${TASK_NAME}`);
            sessionStorage.removeItem(`task_session_${TASK_NAME}`);
            sessionStorage.removeItem('workden_active_task_name');
            try {
              await stopTracking(false, true);
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch(e) {}
            lockAndLeave('/Tasks');
          }
        }} className="rounded-full border">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-purple-700">Form Filling</h1>
        </div>
        <div className="text-sm font-mono font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
          ⏱ {String(Math.floor(remainingTime/3600)).padStart(2,'0')}:{String(Math.floor((remainingTime%3600)/60)).padStart(2,'0')}:{String(remainingTime%60).padStart(2,'0')}
        </div>
        <span className="text-sm font-semibold text-gray-600">{savedCount}/{TOTAL}</span>
      </div>

      {/* Live Activity Bar */}
      <LiveActivityBar startTime={startTime} savedCount={savedCount} total={TOTAL} trackerRef={activityTrackerRef} onMetricsUpdate={pushLiveBarMetrics} />

      {/* Items */}
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {forms.map((form, index) => (
          <div key={form.id} className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
            {/* Item Header */}
            <div className={`flex items-center justify-between px-5 py-4 text-white font-semibold ${
              index % 2 === 0
                ? 'bg-gradient-to-r from-purple-700 to-purple-500'
                : 'bg-gradient-to-r from-blue-500 to-teal-400'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 bg-white/25 rounded-full flex items-center justify-center font-bold text-base">{form.id}</span>
                <span className="text-lg font-bold">Item #{form.id}</span>
              </div>
              {!form.isSaved ? (
                <Button onClick={() => handleSave(form)} size="sm"
                  className="bg-white/20 hover:bg-white/35 text-white border border-white/40 font-semibold px-4 py-2 h-auto rounded-xl">
                  <Save className="w-4 h-4 mr-1.5" />Save
                </Button>
              ) : (
                <span className="text-sm bg-green-500 px-4 py-1.5 rounded-full font-semibold">✓ Saved</span>
              )}
            </div>

            {/* Item Content */}
            <div className="bg-white p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FIELDS.map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label} *</label>
                    <textarea
                      placeholder="Type here..."
                      value={form[field]}
                      onChange={e => { handleChange(form.id, field, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                      disabled={form.isSaved}
                      rows={1}
                      className="w-full border border-gray-200 focus:border-purple-400 text-base bg-white rounded-lg px-3 py-2 resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-60 disabled:bg-gray-50"
                      style={{ fontSize: '16px', minHeight: '44px' }}
                    />
                  </div>
                ))}
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Address *</label>
                  <textarea
                    placeholder="Type here..."
                    value={form.fullAddress}
                    onChange={e => { handleChange(form.id, 'fullAddress', e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    disabled={form.isSaved}
                    rows={1}
                    className="w-full border border-gray-200 focus:border-purple-400 text-base bg-white rounded-lg px-3 py-2 resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-60 disabled:bg-gray-50"
                    style={{ fontSize: '16px', minHeight: '44px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Submit Task Button */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleSubmit}
            disabled={savedCount === 0 || submitting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-40 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg transition-all"
          >
            <Send className="w-5 h-5" />
            {submitting ? 'Submitting...' : `Submit Task (${savedCount} saved)`}
          </button>
        </div>
      </div>
    </div>
  );
}
