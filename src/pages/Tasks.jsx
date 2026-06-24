import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Lock, Play, CreditCard, CheckCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { getTaskLockStatus } from "@/lib/taskLockStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import TaskEntryNotificationModal from "@/components/TaskEntryNotificationModal";

const TASK_CATEGORIES = [
  { name: "Data Entry", icon: "📝", color: "bg-blue-50 border-blue-200", headerColor: "bg-blue-100", iconBg: "bg-blue-200", route: "/DataEntry" },
  { name: "Form Filling", icon: "📋", color: "bg-purple-50 border-purple-200", headerColor: "bg-purple-100", iconBg: "bg-purple-200", route: "/FormFilling" },
  { name: "PDF to Word Typing", icon: "📄", color: "bg-orange-50 border-orange-200", headerColor: "bg-orange-100", iconBg: "bg-orange-200", route: "/PdfToWordTyping", displayName: "PDF to Word" },
  { name: "Grammar Correction", icon: "✍️", color: "bg-amber-50 border-amber-200", headerColor: "bg-amber-100", iconBg: "bg-amber-200", route: "/GrammarCorrection" },
];

const TASK_ROUTES = {
  "Data Entry": "/DataEntry", "Form Filling": "/FormFilling",
  "Grammar Correction": "/GrammarCorrection", "PDF to Word Typing": "/PdfToWordTyping",
  "Typing": "/Typing", "Hard Captcha Filling": "/CaptchaFilling",
  "Copy-Paste Work": "/CopyPaste", "Chat Support": "/ChatSupport",
};

export default function TasksPage() {
  // Initialize from localStorage immediately to avoid subscription flash
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('workden_4_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [formData, setFormData] = useState({ 
    name: currentUser?.full_name || currentUser?.name || "", 
    mobile: currentUser?.phone || currentUser?.mobile || "", 
    email: currentUser?.email || "", 
    city: currentUser?.city || "", 
    paymentMethod: "", 
    transactionId: "", 
    paidName: "", 
    screenshotFile: null 
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showHelpVideo, setShowHelpVideo] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [platformOff, setPlatformOff] = useState(false);
  const [offMessage, setOffMessage] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  // Track lock status per task slot per category
  const [taskLocks, setTaskLocks] = useState({});
  const [showTaskEntryNotification, setShowTaskEntryNotification] = useState(false);
  const [taskEntryNotificationShown, setTaskEntryNotificationShown] = useState(false);

  const todayStr = new Date().toLocaleDateString('en-CA');

  const { data: globalSettings = [] } = useQuery({
    queryKey: ['global-settings'],
    queryFn: () => base44.entities.GlobalSettings.list(),
    placeholderData: []
  });

  const convertDriveUrl = (url) => {
    if (!url) return "";
    if (url.includes('drive.google.com')) {
      const m1 = url.match(/\/file\/d\/([^/]+)/);
      if (m1) return `https://drive.google.com/uc?export=view&id=${m1[1]}`;
      const m2 = url.match(/[?&]id=([^&]+)/);
      if (m2) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;
    }
    return url;
  };

  const paymentQRCode = convertDriveUrl(
    globalSettings.find(s => s.setting_key === 'payment_qr')?.setting_value ||
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692ab5743b33f5dfad922ff3/5077f5f2d_6172534948808559377.jpg"
  );
  const paymentLink = globalSettings.find(s => s.setting_key === 'payment_link')?.setting_value || "https://razorpay.me/@WorkDen";

  const refreshTaskLocks = useCallback(() => {
    const locks = {};
    TASK_CATEGORIES.forEach(cat => {
      locks[cat.name] = [1, 2, 3].map(slot => {
        const lockName = `${cat.name} Task ${slot}`;
        return getTaskLockStatus(lockName);
      });
    });
    setTaskLocks(locks);
  }, []);

  useEffect(() => {
    loadData();
    refreshTaskLocks();
    checkTaskEntryNotification();
    const onVisible = () => { if (!document.hidden) refreshTaskLocks(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [refreshTaskLocks]);

  const loadData = async () => {
    const savedUserStr = localStorage.getItem('workden_4_user');
    const savedUserSource = localStorage.getItem('workden_4_user_source');
    let user = null;
    if (savedUserSource === 'appuser' && savedUserStr) {
      try {
        user = JSON.parse(savedUserStr);
        setCurrentUser(user);
        const dbUsers = await base44.entities.AppUser.filter({ id: user.id });
        if (dbUsers?.length > 0) { user = dbUsers[0]; setCurrentUser(user); localStorage.setItem('workden_4_user', JSON.stringify(user)); }
      } catch (e) {}
    } else if (savedUserSource === 'user' && savedUserStr) {
      try {
        user = JSON.parse(savedUserStr);
        setCurrentUser(user);
        const dbUsers = await base44.entities.User.filter({ id: user.id });
        if (dbUsers?.length > 0) { user = dbUsers[0]; setCurrentUser(user); localStorage.setItem('workden_4_user', JSON.stringify(user)); }
      } catch (e) {}
    } else {
      try {
        user = await base44.auth.me();
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('workden_4_user', JSON.stringify(user));
        } else if (savedUserStr) {
          user = JSON.parse(savedUserStr);
          setCurrentUser(user);
        }
      } catch (error) {
        if (savedUserStr) { try { user = JSON.parse(savedUserStr); setCurrentUser(user); } catch (e) {} }
      }
    }
    try {
      const settings = await base44.entities.GlobalSettings.list();
      const isPlatformOff = settings.find(s => s.setting_key === 'platform_off_enabled')?.setting_value === 'true';
      const message = settings.find(s => s.setting_key === 'platform_off_message')?.setting_value || "Platform is currently closed.";
      setPlatformOff(isPlatformOff && user?.role !== 'admin');
      setOffMessage(message);
    } catch (e) {}

    if (user) {
      setFormData(prev => ({ 
        ...prev, 
        name: prev.name || user.full_name || user.name || "", 
        email: prev.email || user.email || "", 
        mobile: prev.mobile || user.phone || user.mobile || "",
        city: prev.city || user.city || ""
      }));
      // Load per-slot lock status for each category
      refreshTaskLocks();
    }
  };

  const isSubscriptionLocked = () => {
    if (currentUser?.role === 'admin') return false;
    if (currentUser?.is_subscribed) return false;
    if (currentUser?.free_unlock) return false;
    return true;
  };

  // Slot is 1-based. Returns: { isLocked, lockUntil } for that slot
  const getSlotLock = (catName, slot) => {
    return taskLocks[catName]?.[slot - 1] || { isLocked: false, lockUntil: null };
  };

  // Task slot unlock logic:
  // Slot 1: always available (unless locked)
  // Slot 2: available only if slot 1 is locked (was started and exited)
  // Slot 3: available only if slot 2 is locked
  const isSlotAccessible = (catName, slot) => {
    if (slot === 1) return true;
    // Previous slot must have been locked (i.e., used)
    return getSlotLock(catName, slot - 1).isLocked;
  };

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingScreenshot(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, screenshotFile: file_url }));
    } catch (error) { alert("Failed to upload screenshot."); }
    finally { setUploadingScreenshot(false); }
  };

  const handleSubmitPayment = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim() || !formData.email.trim() || !formData.city.trim() || !formData.paymentMethod || !formData.transactionId.trim() || !formData.paidName.trim()) {
      alert("⚠️ Please fill all required fields"); return;
    }
    if (!agreeTerms) { alert("⚠️ Please agree to the terms and conditions"); return; }
    setSubmitting(true);
    try {
      const existingPayments = await base44.entities.SubscriptionPayment.filter({ user_id: currentUser.id });
      const pendingPayment = existingPayments?.find(p => p.status === 'pending');
        
      if (pendingPayment) {
        await base44.entities.SubscriptionPayment.update(pendingPayment.id, {
          user_name: formData.name, user_email: formData.email,
          mobile: formData.mobile, city: formData.city, payment_method: formData.paymentMethod,
          transaction_id: formData.transactionId, paid_name: formData.paidName,
          screenshot_url: formData.screenshotFile || ""
        });
        setSubmitted(true);
        setSubmitting(false); 
        setShowPaymentDialog(false); 
        return;
      } 
      
      const approvedPayment = existingPayments?.find(p => p.status === 'approved');
      if (approvedPayment) {
        alert("You have already submitted this form and it was approved. If you need help, contact support.");
        setSubmitting(false); setShowPaymentDialog(false); return;
      }

      await base44.entities.SubscriptionPayment.create({
        user_id: currentUser.id, user_name: formData.name, user_email: formData.email,
        mobile: formData.mobile, city: formData.city, payment_method: formData.paymentMethod,
        transaction_id: formData.transactionId, paid_name: formData.paidName,
        screenshot_url: formData.screenshotFile || "", amount: 999, status: "pending"
      });
      setSubmitted(true);
    } catch (error) { alert("❌ Failed to submit. Please try again."); }
    finally { setSubmitting(false); }
  };

  const checkTaskEntryNotification = async () => {
    try {
      const settings = await base44.entities.GlobalSettings.filter({
        setting_key: "task_entry_notification_enabled"
      });
      if (settings.length > 0 && settings[0].setting_value === 'true' && !taskEntryNotificationShown && currentUser?.is_subscribed) {
        setShowTaskEntryNotification(true);
        setTaskEntryNotificationShown(true);
      }
    } catch (e) {
      console.error("Error checking task entry notification:", e);
    }
  };

  const allLocked = isSubscriptionLocked();

  if (platformOff) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Platform Closed</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{offMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Task Entry Notification Modal */}
      <TaskEntryNotificationModal 
        open={showTaskEntryNotification} 
        onClose={() => setShowTaskEntryNotification(false)}
        onContinue={() => {}}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-black text-gray-900">Available Tasks</h1>
          <p className="text-gray-400 text-sm mt-0.5">Select a task category to start earning</p>

          {(currentUser?.is_subscribed || currentUser?.free_unlock) ? (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <p className="text-green-800 text-xs font-semibold">
                {currentUser?.free_unlock ? 'Admin Unlocked' : 'Subscription Active'}
              </p>
            </div>
          ) : null}

          {!allLocked && (
            <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <p className="text-green-800 text-xs font-semibold">Sab tasks unlock hain! Koi bhi karo 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* How to earn video — only when locked */}
      {allLocked && (
        <div className="px-4 pt-4 max-w-xl mx-auto">
          <button
            onClick={() => setShowHelpVideo(true)}
            className="w-full bg-gray-900 rounded-2xl overflow-hidden flex items-center gap-4 p-4 hover:bg-gray-800 transition-colors"
          >
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <div className="w-0 h-0 border-l-[14px] border-l-white border-t-[9px] border-t-transparent border-b-[9px] border-b-transparent ml-1"></div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-sm">How to Earn Money Online 💰</p>
              <p className="text-gray-400 text-xs mt-0.5">Watch WorkDen platform demo</p>
            </div>
          </button>
        </div>
      )}

      {/* Task Categories */}
      <div className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {TASK_CATEGORIES.map((cat) => {
          const isExpanded = expandedCategories[cat.name];
          const taskNums = [1, 2, 3];
          // Count how many slots are locked (used) today
          const lockedCount = taskNums.filter(n => getSlotLock(cat.name, n).isLocked).length;

          return (
            <div key={cat.name} className={`rounded-2xl border-2 overflow-hidden ${cat.color}`}>
              {/* Category Header — clickable to expand */}
              <button
                className={`w-full flex items-center gap-3 px-4 py-4 ${cat.headerColor} transition-colors`}
                onClick={() => !allLocked && toggleCategory(cat.name)}
              >
                <div className={`w-10 h-10 ${cat.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                  {allLocked ? <Lock className="w-4 h-4 text-gray-500" /> : cat.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900 text-base">{cat.displayName || cat.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {allLocked ? 'Subscribe to unlock' : lockedCount === 3 ? '✅ All tasks used today • Resets at 7 AM' : `${3 - lockedCount} task${3 - lockedCount !== 1 ? 's' : ''} available • Click to ${isExpanded ? 'collapse' : 'expand'}`}
                  </p>
                </div>
                {allLocked ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPaymentDialog(true); setPaymentStep(1); setSubmitted(false); }}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                  >
                    <CreditCard className="w-3 h-3" />
                    Subscribe
                  </button>
                ) : (
                  isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Expanded Task List */}
              {isExpanded && !allLocked && (
                <div className="bg-white border-t border-gray-100 divide-y divide-gray-50">
                  {taskNums.map((taskNum) => {
                    const slotLock = getSlotLock(cat.name, taskNum);
                    const accessible = isSlotAccessible(cat.name, taskNum);
                    // Slot is "used/locked" = was started and exited
                    const isUsedLocked = slotLock.isLocked;
                    // Slot is "pending unlock" = not accessible yet (prev task not done)
                    const isPendingUnlock = !accessible;
                    const taskLabel = `${cat.displayName || cat.name} — Task ${taskNum}`;
                    const badgeColors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600'];

                    return (
                      <div key={taskNum} className={`flex items-center gap-3 px-4 py-3.5 ${(isUsedLocked || isPendingUnlock) ? 'opacity-60' : ''}`}>
                        {/* Number badge */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                          isUsedLocked ? 'bg-red-100 text-red-500' :
                          isPendingUnlock ? 'bg-gray-200 text-gray-400' :
                          badgeColors[taskNum - 1] + ' text-white'
                        }`}>
                          {(isUsedLocked || isPendingUnlock) ? '🔒' : taskNum}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${(isUsedLocked || isPendingUnlock) ? 'text-gray-400' : 'text-gray-900'}`}>{taskLabel}</p>
                          {isUsedLocked && (
                            <p className="text-red-500 text-xs mt-0.5">🔒 Locked until 7:00 AM IST</p>
                          )}
                          {isPendingUnlock && (
                            <p className="text-amber-600 text-xs mt-0.5">⏳ Complete Task {taskNum - 1} first</p>
                          )}
                        </div>

                        {isUsedLocked || isPendingUnlock ? (
                          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl ${isUsedLocked ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'}`}>
                            <Lock className="w-3 h-3" />
                            {isUsedLocked ? 'Used' : 'Locked'}
                          </div>
                        ) : (
                          <Link to={`${cat.route}?task=${taskNum}`} onClick={refreshTaskLocks}>
                            <button className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                              <Play className="w-3.5 h-3.5" />
                              Start
                            </button>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Subscribe CTA */}
        {allLocked && (
          <div className="mt-4 bg-gray-900 rounded-2xl p-5 text-center">
            <p className="text-white font-black text-lg mb-1">Unlock All Tasks</p>
            <p className="text-gray-400 text-sm mb-4">One-time subscription • ₹999 • Valid 1 year</p>
            <button
              onClick={() => { setShowPaymentDialog(true); setPaymentStep(1); setSubmitted(false); }}
              className="bg-white text-gray-900 font-black px-8 py-3 rounded-xl text-base hover:bg-gray-100 transition-colors"
            >
              Subscribe Now — ₹999
            </button>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              {submitted ? "Payment Submitted!" : paymentStep === 1 ? "Subscribe — ₹999" : "Payment Confirmation"}
            </DialogTitle>
            {!submitted && (
              <DialogDescription className="text-center">
                {paymentStep === 1 ? "One-time ₹999 to unlock all tasks" : "Fill your details after payment"}
              </DialogDescription>
            )}
          </DialogHeader>

          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700">Payment Submitted!</h3>
              <p className="text-gray-600 text-sm">Admin will verify and activate within 24 hours.</p>
              <Button onClick={() => setShowPaymentDialog(false)} className="w-full bg-green-600">Done</Button>
            </div>
          ) : paymentStep === 1 ? (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="bg-gray-900 text-white py-3 px-6 rounded-xl inline-block mb-3">
                  <p className="text-3xl font-black">₹999</p>
                  <p className="text-sm text-gray-400">One-time Subscription</p>
                </div>
              </div>
              <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                <Button className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold text-base">💳 Pay ₹999 — Click Here</Button>
              </a>
              <div className="text-center text-sm text-gray-400 font-semibold">OR scan QR</div>
              <div className="text-center">
                <div className="mx-auto max-w-[180px] bg-white p-3 rounded-2xl shadow-xl border-2 border-gray-200">
                  <img src={paymentQRCode} alt="QR" className="w-full h-auto rounded-xl" />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-800 font-semibold">⚠️ Non-refundable • Valid for 1 year</p>
              </div>
              <Button onClick={() => setPaymentStep(2)} className="w-full h-11 bg-gray-900 hover:bg-gray-800">I've Made the Payment →</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitPayment} className="space-y-3 py-2" autoComplete="off">
              <div><Label>Full Name *</Label><Input autoComplete="new-password" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your full name" required /></div>
              <div><Label>Mobile Number *</Label><Input autoComplete="new-password" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Mobile number" required /></div>
              <div><Label>Email Address *</Label><Input type="email" autoComplete="new-password" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" required /></div>
              <div><Label>City *</Label><Input autoComplete="new-password" value={formData.city || ""} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Your city" required /></div>
              <div>
                <Label>Payment Method *</Label>
                <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-2 border rounded-md text-sm" required>
                  <option value="">Select Method</option>
                  <option value="UPI">UPI</option>
                  <option value="QR">QR Code</option>
                </select>
              </div>
              <div><Label>Transaction ID / UTR *</Label><Input value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} placeholder="UPI Reference / UTR" required /></div>
              <div><Label>Name Used for Payment *</Label><Input value={formData.paidName || ""} onChange={e => setFormData({...formData, paidName: e.target.value})} placeholder="Name from payment app" required /></div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">Non-refundable • Valid 1 year • Read Terms before proceeding</p>
                </div>
                <Button type="button" onClick={() => setShowTermsDialog(true)} variant="outline" className="w-full text-xs h-8">📄 Read Terms & User Agreement</Button>
                <div className="flex items-center gap-2">
                  <Checkbox id="terms" checked={agreeTerms} onCheckedChange={setAgreeTerms} />
                  <label htmlFor="terms" className="text-xs text-amber-900 font-medium cursor-pointer">I agree to WorkDen's Terms & Conditions</label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setPaymentStep(1)} className="flex-1">← Back</Button>
                <Button type="submit" disabled={submitting || !agreeTerms} className="flex-1 bg-green-600 hover:bg-green-700">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <>✅ Confirm</>}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Help Video Dialog */}
      <Dialog open={showHelpVideo} onOpenChange={setShowHelpVideo}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="w-full h-full">
            <iframe src="https://drive.google.com/file/d/1kBxKTj_T9yMgJvEV27lZck0CyKDYIRiv/preview" className="w-full h-full" frameBorder="0" allowFullScreen title="How to earn" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-bold">WorkDen — Terms & User Agreement</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <p>Welcome to WorkDen. By subscribing, you agree to the following terms:</p>
            <div><h3 className="font-bold mb-1">1. Subscription</h3><p>The ₹999 subscription fee is non-refundable and valid for 1 year from activation.</p></div>
            <div><h3 className="font-bold mb-1">2. Earnings</h3><p>Income depends on user performance, task quality, consistency, and platform availability.</p></div>
            <div><h3 className="font-bold mb-1">3. Usage Rules</h3><p>Do not submit fake proof, create multiple accounts, or misuse platform features.</p></div>
            <div><h3 className="font-bold mb-1">4. Contact</h3><p>Support: workdenindia567@gmail.com</p></div>
            <Button onClick={() => setShowTermsDialog(false)} className="w-full bg-gray-900 mt-2">I Understand — Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
