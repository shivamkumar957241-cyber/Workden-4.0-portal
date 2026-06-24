import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, CheckCircle, Clock, TrendingUp, LogOut, BarChart3, UserPlus, Copy,
  Loader2, Eye, Trash2, XCircle, Monitor, Smartphone, RefreshCw, Shield,
  Globe, Activity, Zap, AlertTriangle, X, TrendingDown, Award, DollarSign,
  Target, PieChart, List, Menu, ChevronDown
} from "lucide-react";
import RecruiterActivityTab from "@/components/recruiter/RecruiterActivityTab";
import RecruiterTabContent from "@/components/recruiter/RecruiterTabContent";
import ViewDataDialog from "@/components/ViewDataDialog";
import { createPageUrl } from "@/utils";

const isReallyOnline = (user) => {
  if (!user.is_logged_in) return false;
  const checkTime = user.last_heartbeat || user.last_active;
  if (!checkTime) return false;
  const diffMs = Date.now() - new Date(checkTime).getTime();
  const threshold = user.last_heartbeat ? 45 * 1000 : 5 * 60 * 1000;
  return diffMs < threshold;
};

const getDeviceIcon = (deviceType) => {
  if (deviceType === 'mobile') return '📱';
  if (deviceType === 'tablet') return '📟';
  return '💻';
};

const MiniBar = ({ data, colors }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...data.map(d => d.value), 1);
    const bw = (W - (data.length - 1) * 4) / data.length;
    data.forEach((d, i) => {
      const bh = Math.max(2, (d.value / max) * (H - 10));
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.roundRect(i * (bw + 4), H - bh, bw, bh, 3);
      ctx.fill();
    });
  }, [data, colors]);
  return <canvas ref={canvasRef} width={120} height={50} style={{ display: 'block' }} />;
};

const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .login-root { min-height: 100vh; display: flex; font-family: 'DM Sans', sans-serif; background: #0a0a0f; overflow: hidden; }
  .left-panel { flex: 1; position: relative; display: flex; flex-direction: column; justify-content: space-between; padding: 48px; overflow: hidden; }
  .left-panel::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #0f1923 0%, #0d1f2d 40%, #071a2e 100%); z-index: 0; }
  .orb-1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(0,163,255,0.18) 0%, transparent 70%); top: -100px; left: -100px; animation: floatOrb 8s ease-in-out infinite; z-index: 0; }
  .orb-2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(0,229,180,0.12) 0%, transparent 70%); bottom: -80px; right: -80px; animation: floatOrb 10s ease-in-out infinite reverse; z-index: 0; }
  .grid-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 60px 60px; z-index: 0; }
  @keyframes floatOrb { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-30px) scale(1.05); } }
  .left-content { position: relative; z-index: 1; }
  .brand-logo { display: flex; align-items: center; gap: 10px; }
  .brand-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #00a3ff, #00e5b4); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .brand-name { font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; letter-spacing: 0.5px; }
  .brand-name span { color: #00e5b4; }
  .hero-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(0,229,180,0.1); border: 1px solid rgba(0,229,180,0.25); color: #00e5b4; font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 14px; border-radius: 100px; margin-bottom: 24px; }
  .hero-tag::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #00e5b4; animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
  .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(32px,3.5vw,48px); line-height: 1.2; color: #ffffff; margin-bottom: 20px; }
  .hero-title em { font-style: italic; background: linear-gradient(90deg, #00a3ff, #00e5b4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-desc { font-size: 15px; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 380px; font-weight: 300; }
  .stats-row { display: flex; gap: 40px; margin-top: 48px; }
  .stat-item { display: flex; flex-direction: column; gap: 4px; }
  .stat-number { font-family: 'Playfair Display', serif; font-size: 28px; color: #fff; font-weight: 700; }
  .stat-label { font-size: 12px; color: rgba(255,255,255,0.35); letter-spacing: 0.5px; font-weight: 300; }
  .divider-line { width: 1px; background: rgba(255,255,255,0.08); height: 40px; align-self: center; }
  .right-panel { width: 480px; min-width: 480px; background: #f8f9fc; display: flex; flex-direction: column; justify-content: center; padding: 60px 52px; position: relative; z-index: 1; }
  .right-panel::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 1px; background: linear-gradient(to bottom, transparent, rgba(0,163,255,0.3), transparent); }
  .form-header { margin-bottom: 40px; }
  .form-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #00a3ff; margin-bottom: 12px; }
  .form-title { font-family: 'Playfair Display', serif; font-size: 32px; color: #0f1923; line-height: 1.2; margin-bottom: 10px; }
  .form-subtitle { font-size: 14px; color: #8a8fa8; font-weight: 300; }
  .field-group { margin-bottom: 22px; }
  .field-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #3d4155; margin-bottom: 8px; }
  .field-wrapper { position: relative; }
  .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #b0b4c8; width: 16px; height: 16px; pointer-events: none; transition: color 0.2s; }
  .field-input { width: 100%; height: 50px; padding: 0 44px; background: #fff; border: 1.5px solid #e4e6ef; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0f1923; outline: none; transition: border-color 0.25s, box-shadow 0.25s; }
  .field-input::placeholder { color: #c0c4d4; font-weight: 300; }
  .field-input:focus { border-color: #00a3ff; box-shadow: 0 0 0 4px rgba(0,163,255,0.1); }
  .field-group:focus-within .field-icon { color: #00a3ff; }
  .eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #b0b4c8; padding: 2px; transition: color 0.2s; display: flex; align-items: center; }
  .eye-btn:hover { color: #00a3ff; }
  .error-box { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #fff5f5; border: 1.5px solid #ffd0d0; border-radius: 10px; color: #d32f2f; font-size: 13px; margin-bottom: 22px; }
  .submit-btn { width: 100%; height: 52px; background: linear-gradient(135deg, #0a1628 0%, #1a2e4a 100%); color: #fff; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: transform 0.15s, box-shadow 0.3s; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .submit-btn:hover { box-shadow: 0 8px 30px rgba(10,22,40,0.4); transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .form-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e8eaf2; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: #b0b4c8; }
  @media (max-width: 900px) { .left-panel { display: none; } .right-panel { width: 100%; min-width: unset; padding: 40px 28px; } .login-root { background: #f8f9fc; } }
`;

function RecruiterLogin({ loginForm, setLoginForm, loginError, loginLoading, showPassword, setShowPassword, onLogin }) {
  return (
    <>
      <style>{loginStyles}</style>
      <div className="login-root">
        <div className="left-panel">
          <div className="grid-lines" /><div className="orb-1" /><div className="orb-2" />
          <div className="left-content brand-logo">
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="#fff" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="brand-name">Recruit<span>Pro</span></span>
          </div>
          <div className="left-content" style={{ marginTop: "auto" }}>
            <div className="hero-tag">Recruiter Portal</div>
            <h1 className="hero-title">Hire smarter,<br /><em>move faster.</em></h1>
            <p className="hero-desc">Your intelligent recruitment command center. Manage pipelines, track candidates, and close roles — all from one place.</p>
            <div className="stats-row">
              <div className="stat-item"><span className="stat-number">48k+</span><span className="stat-label">Active Candidates</span></div>
              <div className="divider-line" />
              <div className="stat-item"><span className="stat-number">94%</span><span className="stat-label">Placement Rate</span></div>
              <div className="divider-line" />
              <div className="stat-item"><span className="stat-number">3.2x</span><span className="stat-label">Faster Hiring</span></div>
            </div>
          </div>
          <div className="left-content" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 300 }}>256-bit encrypted · SOC 2 compliant · GDPR ready</span>
          </div>
        </div>
        <div className="right-panel">
          <div className="form-header">
            <div className="form-eyebrow">Recruiter Access</div>
            <h2 className="form-title">Welcome back</h2>
            <p className="form-subtitle">Sign in to your recruiter dashboard</p>
          </div>
          <form onSubmit={onLogin}>
            {loginError && (<div className="error-box">{loginError}</div>)}
            <div className="field-group">
              <label className="field-label">User ID</label>
              <div className="field-wrapper">
                <svg className="field-icon" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                <input className="field-input" placeholder="Mobile / Email / Recruiter Code" value={loginForm.userId} onChange={(e) => setLoginForm({ ...loginForm, userId: e.target.value })} required />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="field-wrapper">
                <svg className="field-icon" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                <input className="field-input" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>}
                </button>
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loginLoading}>
              {loginLoading ? (<><div className="spinner" />Authenticating...</>) : (<>Login to Dashboard</>)}
            </button>
          </form>
          <div className="form-footer"><span>Secured with end-to-end encryption</span></div>
        </div>
      </div>
    </>
  );
}

export default function RecruiterDashboard() {
  const [recruiter, setRecruiter] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", qualification: "", recruiter_name: "" });
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ userId: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [withdrawals, setWithdrawals] = useState([]);
  const [subscriptionPayments, setSubscriptionPayments] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskDateStart, setTaskDateStart] = useState("");
  const [taskDateEnd, setTaskDateEnd] = useState("");
  const [perfSummaryDialog, setPerfSummaryDialog] = useState(false);
  const [viewingPerf, setViewingPerf] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [referralPartners, setReferralPartners] = useState([]);
  const [forceLogoutLoading, setForceLogoutLoading] = useState(null);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [reportUser, setReportUser] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [perfSearchQuery, setPerfSearchQuery] = useState("");
  const [perfMonthFilter, setPerfMonthFilter] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);
  const [taskRecruiterFilter, setTaskRecruiterFilter] = useState("");
  const [userRecruiterFilter, setUserRecruiterFilter] = useState("all");
  const [assignRecruiterDialog, setAssignRecruiterDialog] = useState(false);
  const [assignRecruiterUser, setAssignRecruiterUser] = useState(null);
  const [assignRecruiterName, setAssignRecruiterName] = useState("");
  const [liveActivities, setLiveActivities] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [lastActivityRefresh, setLastActivityRefresh] = useState(new Date());
  const [nowTick, setNowTick] = useState(Date.now());
  const [viewingLiveActivity, setViewingLiveActivity] = useState(null);
  const [viewingHistoryActivity, setViewingHistoryActivity] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deviceOfflineFilter, setDeviceOfflineFilter] = useState("all");
  const [analyticsTab, setAnalyticsTab] = useState("funnel");
  const [tagFilter, setTagFilter] = useState("all");
  const [expandedProofId, setExpandedProofId] = useState(null);
  const [viewingProofData, setViewingProofData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdown, setProfileDropdown] = useState(false);

  const assignedUsersRef = useRef([]);
  useEffect(() => { assignedUsersRef.current = assignedUsers; }, [assignedUsers]);

  const recruiterRef = useRef(null);
  useEffect(() => { recruiterRef.current = recruiter; }, [recruiter]);
  useEffect(() => {
    if (!isLoggedIn) return;
    const pollOnlineStatus = async () => {
      const rec = recruiterRef.current;
      if (!rec) return;
      try {
        const freshUsers = await base44.entities.AppUser.list('-created_date', 1000);
        const myUsers = freshUsers.filter(u => String(u.assigned_recruiter_id) === String(rec.id));
        setAssignedUsers(myUsers);
      } catch (e) {}
    };
    const pollInterval = setInterval(pollOnlineStatus, 20000);
    return () => clearInterval(pollInterval);
  }, [isLoggedIn]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeSinceStr = (dateStr) => {
    if (!dateStr) return 'N/A';
    const diff = nowTick - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const allRecruiters = await base44.entities.Recruiter.list();
      const found = allRecruiters.find(
        r => (r.recruiter_code === loginForm.userId.trim() || r.mobile === loginForm.userId.trim() || r.email === loginForm.userId.trim()) &&
             r.password === loginForm.password.trim() && r.status === 'active'
      );
      if (!found) { setLoginError("❌ Invalid User ID or Password."); return; }
      localStorage.setItem('workden_4_recruiter_id', found.id);
      localStorage.setItem('workden_4_user_source', 'recruiter');
      setRecruiter(found);
      setIsLoggedIn(true);
      await loadData(found);
    } catch (err) {
      setLoginError("❌ Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    const savedId = localStorage.getItem('workden_4_recruiter_id');
    const userSource = localStorage.getItem('workden_4_user_source');
    if (savedId && userSource === 'recruiter') autoLogin(savedId);
  }, []);

  const autoLogin = async (recruiterId) => {
    setLoading(true);
    try {
      const allRecruiters = await base44.entities.Recruiter.list();
      const found = allRecruiters.find(r => r.id === recruiterId && r.status === 'active');
      if (found) { setRecruiter(found); setIsLoggedIn(true); await loadData(found); }
    } catch (e) {}
    finally { setLoading(false); }
  };

  const loadData = async (rec) => {
    try {
      const [allAppUsers, allProofs, allWithdrawals, allSubPayments, allReferralPartners] = await Promise.all([
        base44.entities.AppUser.list('-created_date', 1000),
        base44.entities.Proof.list('-created_date', 2000),
        base44.entities.WithdrawalRequest.list('-created_date', 1000),
        base44.entities.SubscriptionPayment.list('-created_date', 1000),
        base44.entities.ReferralPartner.list('-created_date', 500)
      ]);
      const myUsers = allAppUsers.filter(u => String(u.assigned_recruiter_id) === String(rec.id));
      setAssignedUsers(myUsers);
      const myUserIds = new Set(myUsers.map(u => String(u.id)));
      setProofs(allProofs.filter(p => myUserIds.has(String(p.user_id))));
      setWithdrawals(allWithdrawals.filter(w => myUserIds.has(String(w.user_id))));
      setSubscriptionPayments(allSubPayments.filter(s => myUserIds.has(String(s.user_id))));
      setReferralPartners(allReferralPartners.filter(r => myUserIds.has(String(r.user_id))));
    } catch (e) { console.error('loadData error:', e); }
  };

  useEffect(() => {
    if (!isLoggedIn || !recruiter) return;
    const interval = setInterval(() => loadData(recruiter), 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, recruiter]);

  const getFilteredUsers = () => {
    const now = new Date();
    return assignedUsers.filter(u => {
      const d = new Date(u.created_date);
      if (dateFilter !== "all") {
        if (dateFilter === "today") { const s = new Date(now); s.setHours(0,0,0,0); if (d < s) return false; }
        else if (dateFilter === "yesterday") { const s = new Date(now); s.setDate(s.getDate()-1); s.setHours(0,0,0,0); const e = new Date(s); e.setHours(23,59,59,999); if (d < s || d > e) return false; }
        else if (dateFilter === "last2days") { const s = new Date(now); s.setDate(s.getDate()-2); s.setHours(0,0,0,0); if (d < s) return false; }
        else if (dateFilter === "lastweek") { const s = new Date(now); s.setDate(s.getDate()-7); if (d < s) return false; }
        else if (dateFilter === "lastmonth") { const s = new Date(now); s.setMonth(s.getMonth()-1); if (d < s) return false; }
        else if (dateFilter === "custom" && customStart && customEnd) { if (d < new Date(customStart) || d > new Date(customEnd + "T23:59:59")) return false; }
      }
      if (statusFilter === "subscribed" && !u.is_subscribed) return false;
      if (statusFilter === "not_subscribed" && u.is_subscribed) return false;
      if (userSearch.trim()) {
        const s = userSearch.toLowerCase();
        if (!u.full_name?.toString()?.toLowerCase()?.includes(s) && !u.email?.toString()?.toLowerCase()?.includes(s) && !u.login_user_id?.toString()?.toLowerCase()?.includes(s) && !u.phone?.toString()?.toLowerCase()?.includes(s)) return false;
      }
      if (userRecruiterFilter !== 'all' && (u.assigned_recruiter_name || '') !== userRecruiterFilter) return false;
      if (tagFilter !== 'all') { const tag = getUserTag(u.id); if (tag.label !== tagFilter) return false; }
      return true;
    });
  };

  const getFilteredProofs = () => {
    return proofs.filter(p => {
      if (taskStatusFilter !== 'all' && p.status !== taskStatusFilter) return false;
      if (taskSearch.trim()) {
        const s = taskSearch.toLowerCase();
        const user = assignedUsers.find(u => String(u.id) === String(p.user_id));
        if (!p.user_name?.toString()?.toLowerCase()?.includes(s) && !p.work_type?.toString()?.toLowerCase()?.includes(s) && !user?.phone?.toString()?.toLowerCase()?.includes(s) && !user?.email?.toString()?.toLowerCase()?.includes(s)) return false;
      }
      if (taskDateStart && taskDateEnd) {
        const d = new Date(p.submitted_date || p.created_date);
        if (d < new Date(taskDateStart) || d > new Date(taskDateEnd + "T23:59:59")) return false;
      }
      if (taskRecruiterFilter.trim()) {
        const user = assignedUsers.find(u => String(u.id) === String(p.user_id));
        const rName = (user?.assigned_recruiter_name || recruiter?.name || '').toLowerCase();
        if (!rName.includes(taskRecruiterFilter.toLowerCase())) return false;
      }
      return true;
    });
  };

  const handleDeleteUser = async (u) => {
    try {
      await base44.entities.AppUser.delete(u.id);
      await loadData(recruiter);
      setDeleteConfirmUser(null);
      alert("✅ User deleted!");
    } catch (e) { alert("❌ Failed to delete user."); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.city.trim()) {
      alert("⚠️ Name, Phone, Email and City are required"); return;
    }
    setCreating(true);
    try {
      const enteredRecruiterName = form.recruiter_name?.trim() || "";
      const newUser = await base44.entities.AppUser.create({
        login_user_id: form.email.trim(), login_password: form.phone.trim(),
        full_name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
        city: form.city.trim(), qualification: form.qualification.trim(),
        role: "user", is_subscribed: false, status: "active",
        free_unlock: false, training_access: false,
        assigned_tasks: [], wallet_balance: 0, total_earnings: 0,
        gamification_points: 0, badge: "Bronze",
        created_by_recruiter_id: String(recruiter.id),
        assigned_recruiter_id: String(recruiter.id),
        assigned_recruiter_name: recruiter.name || recruiter.full_name || recruiter.recruiter_name || enteredRecruiterName || "Recruiter",
      });
      setCreatedCreds({ userId: newUser.login_user_id, password: newUser.login_password, name: newUser.full_name });
      setForm({ name: "", phone: "", email: "", city: "", qualification: "", recruiter_name: "" });
      await loadData(recruiter);
    } catch (err) { alert("❌ Failed to create user. Try again."); }
    finally { setCreating(false); }
  };

  const handleForceLogout = async (user) => {
    if (!confirm(`Force logout ${user.full_name}?\n\nThey will be logged out from their device. Data, wallet PIN and settings will NOT be affected.`)) return;
    setForceLogoutLoading(user.id);
    try {
      await base44.entities.AppUser.update(user.id, { is_logged_in: false, session_id: null });
      await loadData(recruiter);
      alert(`✅ ${user.full_name} logged out. All data is safe.`);
    } catch (e) { alert("❌ Failed to logout."); }
    finally { setForceLogoutLoading(null); }
  };

  const copyText = (text) => { navigator.clipboard.writeText(text); alert("✅ Copied!"); };

  const getUserTag = (userId) => {
    const approvedCount = proofs.filter(p => String(p.user_id) === String(userId) && p.status === 'approved').length;
    if (approvedCount >= 100) return { label: 'Platinum', color: 'bg-purple-600' };
    if (approvedCount >= 50) return { label: 'Gold', color: 'bg-yellow-500' };
    if (approvedCount >= 25) return { label: 'Silver', color: 'bg-gray-400' };
    if (approvedCount >= 1) return { label: 'Normal', color: 'bg-blue-400' };
    return { label: 'New', color: 'bg-gray-300' };
  };

  const handleAssignRecruiter = async () => {
    if (!assignRecruiterUser || !assignRecruiterName.trim()) return;
    try {
      await base44.entities.AppUser.update(assignRecruiterUser.id, { assigned_recruiter_name: assignRecruiterName.trim() });
      await loadData(recruiter);
      setAssignRecruiterDialog(false);
      setAssignRecruiterUser(null);
      setAssignRecruiterName("");
      alert("✅ Recruiter name updated!");
    } catch (e) { alert("❌ Failed to update."); }
  };

  useEffect(() => {
    if (activeTab !== 'activity' || !recruiter) return;
    const fetchActivity = async () => {
      try {
        const currentUsers = assignedUsersRef.current;
        const myUserIds = new Set(currentUsers.map(u => String(u.id)));
        if (myUserIds.size === 0) return;
        const [live, hist] = await Promise.all([
          base44.entities.LiveActivity.list('-start_time', 200),
          base44.entities.ActivityHistory.list('-end_time', 500),
        ]);
        setLiveActivities((live || []).filter(a => myUserIds.has(String(a.user_id))));
        setActivityHistory((hist || []).filter(a => myUserIds.has(String(a.user_id))));
        setLastActivityRefresh(new Date());
      } catch(e) {}
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 3000);
    return () => clearInterval(interval);
  }, [activeTab, recruiter]);

  const fmtDur = (sec) => {
    if (!sec || sec <= 0) return 'N/A';
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const handleLogout = async () => {
    try {
      const { performLogout } = await import('./UserLogin.jsx');
      await performLogout();
    } catch (e) { console.error("Logout error", e); }
    setIsLoggedIn(false);
    setRecruiter(null);
    setLoginForm({ userId: "", password: "" });
  };

  const getTimeSince = (dateStr) => {
    if (!dateStr) return 'N/A';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getOfflineSince = (user) => {
    const t = user.last_active;
    if (!t) return Infinity;
    return Date.now() - new Date(t).getTime();
  };

  const filterByOfflineDuration = (user) => {
    if (deviceOfflineFilter === 'all') return true;
    if (isReallyOnline(user)) return false;
    const diffMs = getOfflineSince(user);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (deviceOfflineFilter === '1d') return diffDays >= 1 && diffDays < 2;
    if (deviceOfflineFilter === '2d') return diffDays >= 2 && diffDays < 3;
    if (deviceOfflineFilter === '3d') return diffDays >= 3 && diffDays < 4;
    if (deviceOfflineFilter === '7d') return diffDays >= 7 && diffDays < 15;
    if (deviceOfflineFilter === '15d') return diffDays >= 15 && diffDays < 30;
    if (deviceOfflineFilter === '30d') return diffDays >= 30;
    return true;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!isLoggedIn) {
    return (
      <RecruiterLogin loginForm={loginForm} setLoginForm={setLoginForm} loginError={loginError}
        loginLoading={loginLoading} showPassword={showPassword} setShowPassword={setShowPassword} onLogin={handleLogin} />
    );
  }

  const filteredUsers = getFilteredUsers();
  const filteredUserIds = new Set(filteredUsers.map(u => String(u.id)));
  const filteredProofsAll = proofs.filter(p => filteredUserIds.has(String(p.user_id)));
  const approvedProofs = filteredProofsAll.filter(p => p.status === 'approved');
  const pendingProofsArr = filteredProofsAll.filter(p => p.status === 'pending');
  const rejectedProofs = filteredProofsAll.filter(p => p.status === 'rejected');
  const filteredProofsDisplay = getFilteredProofs();

  const totalUsers = assignedUsers.length;
  const subscribedUsers = assignedUsers.filter(u => u.is_subscribed).length;
  const activeUsers = assignedUsers.filter(u => {
    const last = u.last_active || u.last_heartbeat;
    if (!last) return false;
    return (Date.now() - new Date(last).getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const inactiveUsers = totalUsers - activeUsers;
  const totalApproved = proofs.filter(p => p.status === 'approved').length;
  const totalRejected = proofs.filter(p => p.status === 'rejected').length;
  const totalPending = proofs.filter(p => p.status === 'pending').length;
  const totalRewards = proofs.filter(p => p.status === 'approved').reduce((s, p) => s + (p.reward_amount || 0), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + (w.amount || 0), 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount || 0), 0);
  const conversionRate = totalUsers > 0 ? ((subscribedUsers / totalUsers) * 100).toFixed(1) : 0;
  const retentionRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;
  const approvalRate = proofs.length > 0 ? ((totalApproved / proofs.length) * 100).toFixed(1) : 0;

  const cityMap = {};
  assignedUsers.forEach(u => { const c = u.city || 'Unknown'; cityMap[c] = (cityMap[c] || 0) + 1; });
  const cityData = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const recruiterMap = {};
  assignedUsers.forEach(u => { const r = u.assigned_recruiter_name || 'Unassigned'; recruiterMap[r] = (recruiterMap[r] || 0) + 1; });
  const recruiterData = Object.entries(recruiterMap).sort((a, b) => b[1] - a[1]);

  const taskMap = {};
  proofs.forEach(p => { taskMap[p.work_type] = (taskMap[p.work_type] || 0) + 1; });
  const taskData = Object.entries(taskMap).sort((a, b) => b[1] - a[1]);

  const tagCounts = { Platinum: 0, Gold: 0, Silver: 0, Normal: 0 };
  assignedUsers.forEach(u => { const tag = getUserTag(u.id); tagCounts[tag.label]++; });

  const deviceMap = {};
  assignedUsers.forEach(u => { const d = u.device_type || 'unknown'; deviceMap[d] = (deviceMap[d] || 0) + 1; });

  const dailyMap = {};
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dailyMap[d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })] = 0; }
  proofs.forEach(p => { const d = new Date(p.submitted_date || p.created_date); const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); if (dailyMap[key] !== undefined) dailyMap[key]++; });
  const dailyLabels = Object.keys(dailyMap);
  const dailyValues = Object.values(dailyMap);

  const taskCounts = {};
  proofs.forEach(p => { taskCounts[p.work_type] = (taskCounts[p.work_type] || 0) + 1; });
  const sortedTasks = Object.entries(taskCounts).sort((a, b) => b[1] - a[1]);
  const topTask = sortedTasks[0]?.[0] || '—';
  const approvedAll = proofs.filter(p => p.status === 'approved');
  const rejectedAll = proofs.filter(p => p.status === 'rejected');
  const overallApprovalRate = proofs.length > 0 ? Math.round((approvedAll.length / proofs.length) * 100) : 0;

  const AnalyticsFunnel = () => {
    const funnelSteps = [
      { label: 'Total Created', value: totalUsers, color: '#3b82f6', pct: 100 },
      { label: 'Active (7d)', value: activeUsers, color: '#8b5cf6', pct: totalUsers > 0 ? Math.round((activeUsers/totalUsers)*100) : 0 },
      { label: 'Subscribed', value: subscribedUsers, color: '#10b981', pct: totalUsers > 0 ? Math.round((subscribedUsers/totalUsers)*100) : 0 },
      { label: 'Task Submitted', value: [...new Set(proofs.map(p => String(p.user_id)))].length, color: '#f59e0b', pct: totalUsers > 0 ? Math.round(([...new Set(proofs.map(p => String(p.user_id)))].length/totalUsers)*100) : 0 },
      { label: 'Task Approved', value: [...new Set(approvedAll.map(p => String(p.user_id)))].length, color: '#06b6d4', pct: totalUsers > 0 ? Math.round(([...new Set(approvedAll.map(p => String(p.user_id)))].length/totalUsers)*100) : 0 },
      { label: 'Withdrawn', value: [...new Set(withdrawals.filter(w=>w.status==='completed').map(w => String(w.user_id)))].length, color: '#ec4899', pct: totalUsers > 0 ? Math.round(([...new Set(withdrawals.filter(w=>w.status==='completed').map(w => String(w.user_id)))].length/totalUsers)*100) : 0 },
    ];
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{l:'Total Users',v:totalUsers,c:'#2563eb',bg:'#eff6ff'},{l:'Active (7d)',v:activeUsers,c:'#7c3aed',bg:'#f5f3ff'},{l:'Inactive',v:inactiveUsers,c:'#6b7280',bg:'#f9fafb'},{l:'Subscribed',v:subscribedUsers,c:'#059669',bg:'#ecfdf5'}].map(({l,v,c,bg})=>(
            <div key={l} className="rounded-xl border p-4 text-center" style={{background:bg,borderColor:c+'33'}}>
              <p className="text-2xl font-bold" style={{color:c}}>{v}</p><p className="text-xs text-gray-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{l:'Conversion',v:conversionRate+'%',c:'#0891b2',bg:'#ecfeff',sub:'Created→Subscribed'},{l:'Retention',v:retentionRate+'%',c:'#0d9488',bg:'#f0fdfa',sub:'Active last 7d'},{l:'Approval',v:approvalRate+'%',c:'#4f46e5',bg:'#eef2ff',sub:'Task success'},{l:'Revenue',v:'₹'+(Number(totalRewards) || 0).toFixed(0),c:'#d97706',bg:'#fffbeb',sub:'Approved rewards'}].map(({l,v,c,bg,sub})=>(
            <div key={l} className="rounded-xl border p-4 text-center" style={{background:bg,borderColor:c+'33'}}>
              <p className="text-xl font-bold" style={{color:c}}>{v}</p><p className="text-xs font-medium text-gray-700">{l}</p><p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">User Conversion Funnel</p><p className="text-xs text-gray-400">Drop analysis from creation to withdrawal</p></div>
          <div className="p-5 space-y-3">
            {funnelSteps.map((step, i) => {
              const dropPct = i > 0 ? funnelSteps[i-1].value > 0 ? (((funnelSteps[i-1].value - step.value) / funnelSteps[i-1].value) * 100).toFixed(0) : 0 : null;
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <span className="text-sm font-medium text-gray-800">{step.label}</span>
                      {dropPct !== null && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">↓{dropPct}%</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: step.color }}>{step.value}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{step.pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full" style={{ width: `${Math.max(step.pct, 2)}%`, backgroundColor: step.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{l:'Submissions',v:proofs.length,c:'#2563eb',bg:'#eff6ff'},{l:'Approved',v:totalApproved,c:'#059669',bg:'#ecfdf5'},{l:'Rejected',v:totalRejected,c:'#dc2626',bg:'#fef2f2'},{l:'Pending',v:totalPending,c:'#d97706',bg:'#fffbeb'}].map(({l,v,c,bg})=>(
            <div key={l} className="rounded-xl border p-4 text-center" style={{background:bg,borderColor:c+'33'}}><p className="text-2xl font-bold" style={{color:c}}>{v}</p><p className="text-xs text-gray-500 mt-0.5">{l}</p></div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[{l:'Total Earnings',v:'₹'+(Number(totalRewards) || 0).toFixed(0),c:'#059669',bg:'#ecfdf5'},{l:'Total Withdrawn',v:'₹'+(Number(totalWithdrawn) || 0).toFixed(0),c:'#dc2626',bg:'#fef2f2'},{l:'Pending Withdrawal',v:'₹'+(Number(pendingWithdrawals) || 0).toFixed(0),c:'#d97706',bg:'#fffbeb'}].map(({l,v,c,bg})=>(
            <div key={l} className="rounded-xl border p-4" style={{background:bg,borderColor:c+'33'}}><p className="text-xl font-bold" style={{color:c}}>{v}</p><p className="text-xs text-gray-600 mt-0.5">{l}</p></div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Referral Partners</p></div>
          <div className="p-4 grid grid-cols-3 gap-4">
            {[{l:'Total Applied',v:referralPartners.length,c:'text-purple-700'},{l:'Approved',v:referralPartners.filter(r=>r.status==='approved').length,c:'text-emerald-700'},{l:'Pending',v:referralPartners.filter(r=>r.status==='pending').length,c:'text-amber-700'}].map(({l,v,c})=>(
              <div key={l} className="text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500 mt-0.5">{l}</p></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const AnalyticsCharts = () => (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">User Tag Distribution</p></div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[{l:'Platinum',v:tagCounts.Platinum,c:'bg-purple-100 text-purple-700'},{l:'Gold',v:tagCounts.Gold,c:'bg-amber-100 text-amber-700'},{l:'Silver',v:tagCounts.Silver,c:'bg-gray-100 text-gray-600'},{l:'Normal',v:tagCounts.Normal,c:'bg-blue-100 text-blue-700'}].map(({l,v,c})=>(
            <div key={l} className="text-center"><div className={`rounded-full w-14 h-14 mx-auto flex items-center justify-center text-xl font-bold ${c}`}>{v}</div><p className="text-xs text-gray-600 mt-2">{l}</p></div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Subscription Status</p></div>
        <div className="p-5 space-y-3">
          {[{l:`Subscribed (${subscribedUsers})`,pct:totalUsers>0?(subscribedUsers/totalUsers)*100:0,c:'bg-emerald-500'},{l:`Not Subscribed (${totalUsers-subscribedUsers})`,pct:totalUsers>0?((totalUsers-subscribedUsers)/totalUsers)*100:0,c:'bg-red-400'}].map(({l,pct,c})=>(
            <div key={l}><div className="flex justify-between text-xs mb-1"><span className="text-gray-700 font-medium">{l}</span><span className="text-gray-400">{Math.round(pct)}%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-2.5"><div className={`${c} h-2.5 rounded-full`} style={{width:`${pct}%`}} /></div></div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Top Task Submissions</p><p className="text-xs text-gray-400">Most popular: {topTask}</p></div>
        <div className="p-5 space-y-3">
          {taskData.slice(0,8).map(([name,count],i)=>{const pct=proofs.length>0?Math.round((count/proofs.length)*100):0;const approved=proofs.filter(p=>p.work_type===name&&p.status==='approved').length;const colors=['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ec4899','#06b6d4','#ef4444','#6366f1'];return(<div key={name}><div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-800 truncate max-w-[60%]">{name}</span><span className="text-gray-400">{count} · ✅{approved}</span></div><div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full" style={{width:`${Math.max(pct,1)}%`,backgroundColor:colors[i%colors.length]}}/></div></div>);})}
          {taskData.length===0&&<p className="text-gray-400 text-center py-4 text-sm">No submissions yet</p>}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">City Distribution</p></div>
        <div className="p-5 space-y-2">
          {cityData.map(([city,count],i)=>{const pct=totalUsers>0?Math.round((count/totalUsers)*100):0;return(<div key={city} className="flex items-center gap-3"><span className="text-xs text-gray-400 w-4">{i+1}</span><span className="text-xs font-medium text-gray-700 w-24 truncate">{city}</span><div className="flex-1 bg-gray-100 rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full" style={{width:`${Math.max(pct,1)}%`}}/></div><span className="text-xs font-semibold text-blue-600 w-6 text-right">{count}</span></div>);})}
          {cityData.length===0&&<p className="text-gray-400 text-center py-4 text-sm">No city data</p>}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Daily Submissions — Last 14 Days</p></div>
        <div className="p-5">
          <div className="flex items-end gap-1.5 h-24">
            {dailyValues.map((v,i)=>{const max=Math.max(...dailyValues,1);const pct=(v/max)*100;return(<div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full relative" style={{height:64}}><div className="absolute bottom-0 w-full rounded-t-sm bg-blue-500 transition-all" style={{height:`${Math.max(pct,v>0?4:0)}%`}} title={`${dailyLabels[i]}: ${v}`}/></div><span className="text-gray-400" style={{fontSize:8,writingMode:'vertical-rl',transform:'rotate(180deg)',whiteSpace:'nowrap'}}>{dailyLabels[i]}</span></div>);})}
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Force Logout Status</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{["User","Status","Last Seen","Action"].map(h=><th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {assignedUsers.filter(u=>u.is_logged_in).map(u=>(
              <tr key={u.id} className={isReallyOnline(u)?'bg-emerald-50/40':''}>
                <td className="px-3 py-2.5"><p className="font-medium text-sm text-gray-900">{u.full_name}</p><p className="text-xs text-gray-400">{u.phone}</p></td>
                <td className="px-3 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${isReallyOnline(u)?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-gray-50 text-gray-500 border-gray-200'}`}>{isReallyOnline(u)?'● Online':'○ Offline'}</span></td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{getTimeSince(u.last_active)}</td>
                <td className="px-3 py-2.5"><Button size="sm" variant="destructive" onClick={()=>handleForceLogout(u)} disabled={forceLogoutLoading===u.id} className="h-7 text-xs"><LogOut className="w-3 h-3 mr-1"/>{forceLogoutLoading===u.id?'Logging out...':'Force Logout'}</Button></td>
              </tr>
            ))}
            {assignedUsers.filter(u=>u.is_logged_in).length===0&&<tr><td colSpan={4} className="text-center py-6 text-gray-400 text-sm">No users currently logged in</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  );

  const navItems = [
    {tab:"dashboard",icon:BarChart3,label:"Dashboard"},
    {tab:"create",icon:UserPlus,label:"Create User",action:()=>{setCreateDialog(true);setCreatedCreds(null);}},
    {tab:"users",icon:Users,label:"My Users",badge:assignedUsers.length},
    {tab:"tasks",icon:CheckCircle,label:"Task Submissions"},
    {tab:"activity",icon:Activity,label:"Live Activity"},
    {tab:"devices",icon:Monitor,label:"Device Tracking"},
    {tab:"performance",icon:TrendingUp,label:"Performance"},
    {tab:"analytics",icon:PieChart,label:"Analytics"},
    {tab:"referralpartners",icon:Users,label:"Referral Partners",badge:referralPartners.length},
    {tab:"profile",icon:Shield,label:"My Profile"},
  ];
  const pageLabels = {dashboard:"Dashboard",users:"My Users",tasks:"Task Submissions",activity:"Live Activity",devices:"Device Tracking",performance:"Performance",analytics:"Analytics",referralpartners:"Referral Partners",profile:"My Profile"};
  const activeNow = liveActivities.filter(a => { const ls = a.behavior_data?.last_activity || a.start_time; return ls && (Date.now()-new Date(ls).getTime())/60000<30; }).length;

  return (
    <div className="bg-gray-50 flex" style={{ fontFamily:'Inter,system-ui,sans-serif', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 232 : 0, minWidth: sidebarOpen ? 232 : 0, transition:'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)', overflow:'hidden', flexShrink:0, height:'100vh', position:'sticky', top:0 }}
        className="flex flex-col bg-white border-r border-gray-100 shadow-xl z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-100 flex-shrink-0" style={{ minWidth:232 }}>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e9e7d6f2c135f2968907d8/b84b417d1_6296293782902737811.jpg" alt="WorkDen" className="h-8 object-contain flex-shrink-0" />
          <span className="font-bold text-gray-900 text-xs whitespace-nowrap tracking-wide">WorkDen Recruiter Panel</span>
        </div>
        {/* Nav — scrollable, takes all remaining space */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" style={{ minWidth:232 }}>
          {navItems.map(({ tab, icon: Icon, label, badge, action }) => (
            <button key={tab}
              onClick={() => { if (action) { action(); } else { setActiveTab(tab); } }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === tab && tab !== 'create'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-0.5'
                }`}>
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${activeTab === tab && tab !== 'create' ? 'text-white' : 'text-gray-400'}`} />
              <span className="truncate">{label}</span>
              {badge > 0 && <span className={`ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${activeTab === tab && tab !== 'create' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-600'}`}>{badge}</span>}
            </button>
          ))}
        </nav>
        {/* Footer — always pinned to bottom */}
        <div className="flex-shrink-0 border-t border-gray-100 p-2" style={{ minWidth:232 }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow flex-shrink-0">{recruiter?.name?.[0]?.toUpperCase() || 'R'}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{recruiter?.name}</p>
              <p className="text-xs text-gray-400 truncate">{recruiter?.recruiter_code}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:translate-x-0.5">
            <LogOut className="w-4 h-4 flex-shrink-0" /><span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} style={{display:'none'}} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 lg:px-5 h-14 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"><Menu className="w-5 h-5" /></button>
            <h1 className="text-sm font-bold text-gray-800">{pageLabels[activeTab] || 'Dashboard'}</h1>
          </div>

        </header>

        {/* Stat Cards — only on users tab */}
        {activeTab === 'users' && (
        <div className="px-4 lg:px-5 pt-4 pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {[
              {label:"My Users",value:assignedUsers.length,icon:Users,grad:"from-blue-500 to-indigo-600",click:null},
              {label:"Approved",value:approvedProofs.length,icon:CheckCircle,grad:"from-emerald-500 to-green-600",click:()=>{setActiveTab('tasks');setTaskStatusFilter('approved');}},
              {label:"Pending",value:pendingProofsArr.length,icon:Clock,grad:"from-amber-400 to-orange-500",click:()=>{setActiveTab('tasks');setTaskStatusFilter('pending');}},
              {label:"Rejected",value:rejectedProofs.length,icon:XCircle,grad:"from-rose-500 to-red-600",click:()=>{setActiveTab('tasks');setTaskStatusFilter('rejected');}},
              {label:"Subscribed",value:assignedUsers.filter(u=>u.is_subscribed).length,icon:TrendingUp,grad:"from-violet-500 to-purple-600",click:null},
              {label:"Online Now",value:assignedUsers.filter(u=>isReallyOnline(u)).length,icon:Activity,grad:"from-cyan-500 to-sky-600",click:()=>setActiveTab('devices')},
              {label:"Active Now",value:activeNow,icon:Zap,grad:"from-pink-500 to-fuchsia-600",click:()=>setActiveTab('activity')},
            ].map(({label,value,icon:Icon,grad,click}) => (
              <div key={label} onClick={click||undefined}
                className={`bg-gradient-to-br ${grad} rounded-xl p-3 flex items-center gap-2.5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all cursor-${click?'pointer':'default'}`}>
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-white/75 truncate leading-tight font-medium">{label}</p>
                  <p className="text-xl font-black text-white leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 px-4 lg:px-5 pb-10 pt-1 overflow-y-auto">
          <RecruiterTabContent
            activeTab={activeTab} filteredUsers={filteredUsers} filteredProofsDisplay={filteredProofsDisplay}
            proofs={proofs} assignedUsers={assignedUsers} subscriptionPayments={subscriptionPayments} withdrawals={withdrawals}
            dateFilter={dateFilter} setDateFilter={setDateFilter} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter} userRecruiterFilter={userRecruiterFilter} setUserRecruiterFilter={setUserRecruiterFilter}
            tagFilter={tagFilter} setTagFilter={setTagFilter} userSearch={userSearch} setUserSearch={setUserSearch} getUserTag={getUserTag}
            setAssignRecruiterUser={setAssignRecruiterUser} setAssignRecruiterName={setAssignRecruiterName} setAssignRecruiterDialog={setAssignRecruiterDialog}
            recruiter={recruiter} setDeleteConfirmUser={setDeleteConfirmUser}
            taskStatusFilter={taskStatusFilter} setTaskStatusFilter={setTaskStatusFilter} taskSearch={taskSearch} setTaskSearch={setTaskSearch}
            taskRecruiterFilter={taskRecruiterFilter} setTaskRecruiterFilter={setTaskRecruiterFilter} taskDateStart={taskDateStart} setTaskDateStart={setTaskDateStart} taskDateEnd={taskDateEnd} setTaskDateEnd={setTaskDateEnd}
            expandedProofId={expandedProofId} setViewingPerf={setViewingPerf} setPerfSummaryDialog={setPerfSummaryDialog} setViewingProofData={setViewingProofData}
            liveActivities={liveActivities} activityHistory={activityHistory} activitySearch={activitySearch} setActivitySearch={setActivitySearch}
            lastActivityRefresh={lastActivityRefresh} nowTick={nowTick} timeSinceStr={timeSinceStr} fmtDur={fmtDur}
            viewingLiveActivity={viewingLiveActivity} setViewingLiveActivity={setViewingLiveActivity} viewingHistoryActivity={viewingHistoryActivity} setViewingHistoryActivity={setViewingHistoryActivity}
            deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm}
            onDeleteConfirm={async () => {
              try {
                if (deleteConfirm.type === 'live') { await base44.entities.LiveActivity.delete(deleteConfirm.item.id); setLiveActivities(prev => prev.filter(a => a.id !== deleteConfirm.item.id)); }
                else { await base44.entities.ActivityHistory.delete(deleteConfirm.item.id); setActivityHistory(prev => prev.filter(a => a.id !== deleteConfirm.item.id)); }
              } catch(e) {} setDeleteConfirm(null);
            }}
            deviceSearch={deviceSearch} setDeviceSearch={setDeviceSearch} deviceOfflineFilter={deviceOfflineFilter} setDeviceOfflineFilter={setDeviceOfflineFilter}
            filterByOfflineDuration={filterByOfflineDuration} getTimeSince={getTimeSince} forceLogoutLoading={forceLogoutLoading} handleForceLogout={handleForceLogout} loadData={loadData}
            approvedAll={approvedAll} rejectedAll={rejectedAll} overallApprovalRate={overallApprovalRate} sortedTasks={sortedTasks} topTask={topTask}
            perfSearchQuery={perfSearchQuery} setPerfSearchQuery={setPerfSearchQuery} perfMonthFilter={perfMonthFilter} setPerfMonthFilter={setPerfMonthFilter}
            setReportUser={setReportUser} setReportDialog={setReportDialog} analyticsTab={analyticsTab} setAnalyticsTab={setAnalyticsTab}
            AnalyticsFunnel={AnalyticsFunnel} AnalyticsCharts={AnalyticsCharts} referralPartners={referralPartners}
          />
        </div>

        {/* Dialogs */}
        <Dialog open={reportDialog} onOpenChange={setReportDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Detailed Report — {reportUser?.user?.full_name}</DialogTitle></DialogHeader>
            {reportUser && (() => {
              const up = reportUser.userProofs; const dateMap = {};
              up.forEach(p => { const date = new Date(p.submitted_date||p.created_date).toLocaleDateString('en-IN'); if(!dateMap[date])dateMap[date]={total:0,approved:0,rejected:0,pending:0,duration:0,activeSeconds:0}; dateMap[date].total++;dateMap[date][p.status]++;dateMap[date].duration+=p.duration_seconds||0; let bd=p.behavior_data;if(typeof bd==='string'){try{bd=JSON.parse(bd);}catch(e){bd=null;}}dateMap[date].activeSeconds+=bd?.active_seconds??bd?.activeSeconds??0; });
              const sortedDates=Object.entries(dateMap).sort((a,b)=>new Date(b[0])-new Date(a[0])); const activeDays=sortedDates.length;
              const allDatesRaw=up.map(p=>new Date(p.submitted_date||p.created_date)); const firstDate=allDatesRaw.length>0?new Date(Math.min(...allDatesRaw)):null; const lastDate=allDatesRaw.length>0?new Date(Math.max(...allDatesRaw)):null;
              const totalDays=firstDate&&lastDate?Math.ceil((lastDate-firstDate)/86400000)+1:0; const inactiveDays=Math.max(0,totalDays-activeDays); const totalHours=(up.reduce((s,p)=>s+(p.duration_seconds||0),0)/3600).toFixed(1);
              return (<div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{l:'Active Days',v:activeDays,c:'text-green-700',bg:'bg-green-50 border-green-200'},{l:'Inactive Days',v:inactiveDays,c:'text-red-600',bg:'bg-red-50 border-red-200'},{l:'Total Hours',v:totalHours+'h',c:'text-blue-700',bg:'bg-blue-50 border-blue-200'},{l:'Total Tasks',v:up.length,c:'text-purple-700',bg:'bg-purple-50 border-purple-200'}].map(({l,v,c,bg})=>(<div key={l} className={`p-3 border rounded-xl text-center ${bg}`}><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500">{l}</p></div>))}
                </div>
                <p className="font-bold text-gray-800 text-sm">Date-wise Activity</p>
                {sortedDates.length===0?<p className="text-gray-500 text-center py-6 text-sm">No submissions yet</p>:(
                  <table className="w-full text-sm border rounded-lg overflow-hidden"><thead className="bg-gray-100"><tr>{["Date","Tasks","✅","❌","⏳","Duration","Active"].map(h=><th key={h} className="p-2 font-semibold text-gray-600 text-left text-xs">{h}</th>)}</tr></thead>
                  <tbody className="divide-y">{sortedDates.map(([date,data])=>{const hrs=Math.floor(data.duration/3600),mins=Math.floor((data.duration%3600)/60);const durStr=data.duration>0?`${hrs>0?hrs+'h ':''}${mins}m`:'—';const actHrs=Math.floor(data.activeSeconds/3600),actMins=Math.floor((data.activeSeconds%3600)/60);const actStr=data.activeSeconds>0?`${actHrs>0?actHrs+'h ':''}${actMins}m`:'—';return(<tr key={date} className="hover:bg-gray-50"><td className="p-2 font-medium text-gray-800 text-xs">{date}</td><td className="p-2 text-center font-bold text-blue-600">{data.total}</td><td className="p-2 text-center font-bold text-green-600">{data.approved}</td><td className="p-2 text-center font-bold text-red-500">{data.rejected}</td><td className="p-2 text-center font-bold text-yellow-600">{data.pending}</td><td className="p-2 text-center text-gray-600 text-xs">{durStr}</td><td className="p-2 text-center text-purple-700 font-semibold text-xs">{actStr}</td></tr>);})}</tbody></table>
                )}
              </div>);
            })()}
          </DialogContent>
        </Dialog>

        {viewingProofData && <ViewDataDialog proof={viewingProofData} onClose={() => setViewingProofData(null)} />}

        <Dialog open={perfSummaryDialog} onOpenChange={setPerfSummaryDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Performance Summary</DialogTitle>{viewingPerf && <p className="text-sm text-gray-500">{viewingPerf.user_name} • {viewingPerf.work_type}</p>}</DialogHeader>
            {viewingPerf?.performance_summary ? <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5"><div className="whitespace-pre-wrap text-sm text-gray-800 bg-white rounded-lg p-4 border border-amber-200">{viewingPerf.performance_summary}</div></div> : <p className="text-gray-500 text-center py-8">No performance summary</p>}
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
          <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
            <p className="text-gray-700">Delete <strong>{deleteConfirmUser?.full_name}</strong>? This cannot be undone.</p>
            <div className="flex gap-2 mt-4"><Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmUser(null)}>Cancel</Button><Button variant="destructive" className="flex-1" onClick={() => handleDeleteUser(deleteConfirmUser)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button></div>
          </DialogContent>
        </Dialog>

        <Dialog open={assignRecruiterDialog} onOpenChange={setAssignRecruiterDialog}>
          <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>✏️ Edit Recruiter Name</DialogTitle></DialogHeader>
            <div className="p-3 bg-gray-50 rounded-lg mb-2"><p className="text-xs text-gray-500">User</p><p className="font-bold text-gray-900">{assignRecruiterUser?.full_name}</p></div>
            <div className="space-y-2"><Label>New Recruiter Name</Label><Input value={assignRecruiterName} onChange={e => setAssignRecruiterName(e.target.value)} placeholder="Enter recruiter name" autoFocus /></div>
            <div className="flex gap-2 mt-4"><Button variant="outline" className="flex-1" onClick={() => setAssignRecruiterDialog(false)}>Cancel</Button><Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleAssignRecruiter}>Save</Button></div>
          </DialogContent>
        </Dialog>

        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" />Create New User</DialogTitle></DialogHeader>
            {createdCreds ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl text-center"><CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" /><p className="font-bold text-green-800">User Created: {createdCreds.name}</p></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"><div><p className="text-xs text-gray-500">User ID</p><p className="font-mono font-bold text-blue-700 text-sm">{createdCreds.userId}</p></div><Button size="sm" variant="outline" onClick={() => copyText(createdCreds.userId)}><Copy className="w-3 h-3" /></Button></div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"><div><p className="text-xs text-gray-500">Password</p><p className="font-mono font-bold text-purple-700 text-lg">{createdCreds.password}</p></div><Button size="sm" variant="outline" onClick={() => copyText(createdCreds.password)}><Copy className="w-3 h-3" /></Button></div>
                  <Button className="w-full bg-blue-600" onClick={() => copyText(`WorkDen Login:\nUser ID: ${createdCreds.userId}\nPassword: ${createdCreds.password}`)}><Copy className="w-4 h-4 mr-2" />Copy Both</Button>
                </div>
                <Button onClick={() => setCreatedCreds(null)} className="w-full bg-green-600">Create Another User</Button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div><Label>Recruiter Name</Label><Input placeholder="Enter recruiter name for this user" value={form.recruiter_name||""} onChange={e => setForm({...form, recruiter_name: e.target.value})} /></div>
                <div><Label>Full Name *</Label><Input placeholder="Enter full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div><Label>Phone * (Password)</Label><Input placeholder="Enter mobile number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
                <div><Label>Email * (User ID)</Label><Input type="email" placeholder="Enter email address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
                <div><Label>City *</Label><Input placeholder="Enter city" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required /></div>
                <div><Label>Qualification</Label><Input placeholder="e.g., Graduate, 12th Pass" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} /></div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><p className="text-xs text-blue-800">🔐 User ID = Email • Password = Mobile Number</p></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating} className="bg-blue-600">{creating?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Creating...</>:<><UserPlus className="w-4 h-4 mr-2"/>Create User</>}</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
