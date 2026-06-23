import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from "recharts";
import {
  Users, TrendingUp, DollarSign, CheckCircle, ArrowLeft, XCircle, Clock,
  UserPlus, Award, TrendingDown, Activity, Minus, Plus, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ─── Revenue Config ──────────────────────────────────────────────────────────
const RATES = {
  subscriptionPrice: 999,
  recruiterSubCommission: 200,
  recruiterTaskCommission: 30,
  userTaskCost: 100,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => n >= 100000 ? `₹${(Number(n/100000) || 0).toFixed(2)}L` : n >= 1000 ? `₹${(Number(n/1000) || 0).toFixed(1)}K` : `₹${n.toLocaleString()}`;
const fmtFull = (n) => `₹${n.toLocaleString()}`;

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, border }) {
  return (
    <div className={`bg-white rounded-2xl border-2 ${border} p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function RevenueRow({ label, value, type, percent, formula }) {
  const isIncome = type === 'income';
  const isNet = type === 'net';
  return (
    <div className={`flex items-start justify-between py-3 border-b border-gray-100 last:border-0 ${isNet ? 'pt-4' : ''}`}>
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          {isIncome && <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>}
          {!isIncome && !isNet && <Minus className="w-3 h-3 text-red-400 flex-shrink-0" />}
          {isNet && <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>}
          <span className={`text-sm font-semibold ${isNet ? 'text-blue-800 text-base' : 'text-gray-700'}`}>{label}</span>
        </div>
        {formula && <p className="text-xs text-gray-400 mt-0.5 ml-4">{formula}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-sm ${isIncome ? 'text-green-600' : isNet ? 'text-blue-700 text-base' : 'text-red-500'}`}>
          {isIncome ? '+' : isNet ? '=' : '-'}{fmtFull(Math.abs(value))}
        </p>
        {percent !== undefined && <p className="text-xs text-gray-400">{percent}% of gross</p>}
      </div>
    </div>
  );
}

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  const { data: users = [] } = useQuery({ queryKey: ['all-users'], queryFn: () => base44.entities.User.list(), initialData: [] });
  const { data: appUsers = [] } = useQuery({ queryKey: ['all-app-users'], queryFn: () => base44.entities.AppUser.list('-created_date', 300), initialData: [] });
  const { data: proofs = [] } = useQuery({ queryKey: ['all-proofs'], queryFn: () => base44.entities.Proof.list('-created_date'), initialData: [] });
  const { data: recruiters = [] } = useQuery({ queryKey: ['recruiters'], queryFn: () => base44.entities.Recruiter.list(), initialData: [] });

  // ── Merged user list ──────────────────────────────────────────────────────
  const allUsers = useMemo(() => [
    ...users.filter(u => u.role !== 'admin'),
    ...appUsers.filter(au => au.role !== 'admin' && !users.some(u => u.login_user_id === au.login_user_id))
  ], [users, appUsers]);

  // ── Proof counts ──────────────────────────────────────────────────────────
  const approvedProofs = proofs.filter(p => p.status === 'approved');
  const pendingProofs  = proofs.filter(p => p.status === 'pending');
  const rejectedProofs = proofs.filter(p => p.status === 'rejected');

  // ── Subscription counts ───────────────────────────────────────────────────
  const activeSubscriptions = allUsers.filter(u => u.is_subscribed || u.free_unlock);
  const recruiterUsers = allUsers.filter(u => u.assigned_recruiter_id || u.created_by_recruiter_id);
  const recruiterActiveSubs = recruiterUsers.filter(u => u.is_subscribed || u.free_unlock);
  const recruiterUserIds = new Set(recruiterUsers.map(u => u.id));

  // ── Revenue calculations ──────────────────────────────────────────────────
  const grossRevenue          = activeSubscriptions.length * RATES.subscriptionPrice;
  const recruiterSubComm      = recruiterActiveSubs.length * RATES.recruiterSubCommission;
  const recruiterApprovedTasks = approvedProofs.filter(p => recruiterUserIds.has(p.user_id)).length;
  const recruiterTaskComm     = recruiterApprovedTasks * RATES.recruiterTaskCommission;
  const totalRecruiterComm    = recruiterSubComm + recruiterTaskComm;
  const userTaskCost          = approvedProofs.length * RATES.userTaskCost;
  const netRevenue            = grossRevenue - totalRecruiterComm - userTaskCost;

  // ── Leaderboard — top users by approved tasks ─────────────────────────────
  const userApprovedMap = {};
  approvedProofs.forEach(p => { userApprovedMap[p.user_id] = (userApprovedMap[p.user_id] || 0) + 1; });
  const leaderboard = Object.entries(userApprovedMap)
    .map(([uid, count]) => {
      const u = allUsers.find(x => x.id === uid);
      return { name: u?.full_name || uid, count, amount: count * 100 };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Last 7 days trend ─────────────────────────────────────────────────────
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dailyTrend = last7Days.map(date => {
    const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayProofs = proofs.filter(p => (p.submitted_date || p.created_date)?.split('T')[0] === date);
    const dayUsers  = allUsers.filter(u => u.created_date?.split('T')[0] === date);
    return {
      date: label,
      approved: dayProofs.filter(p => p.status === 'approved').length,
      rejected: dayProofs.filter(p => p.status === 'rejected').length,
      pending:  dayProofs.filter(p => p.status === 'pending').length,
      newUsers: dayUsers.length,
    };
  });

  // ── Task type breakdown ───────────────────────────────────────────────────
  const taskTypeMap = {};
  proofs.forEach(p => {
    const base = (p.work_type || 'Other').replace(/\s+Task\s+\d+$/i, '').trim();
    if (!taskTypeMap[base]) taskTypeMap[base] = { approved: 0, rejected: 0, pending: 0 };
    taskTypeMap[base][p.status] = (taskTypeMap[base][p.status] || 0) + 1;
  });
  const taskTypeData = Object.entries(taskTypeMap)
    .map(([name, v]) => ({ name, ...v, total: v.approved + v.rejected + v.pending }))
    .sort((a, b) => b.total - a.total).slice(0, 8);

  // ── Status pie ────────────────────────────────────────────────────────────
  const statusPie = [
    { name: 'Approved', value: approvedProofs.length, color: '#22c55e' },
    { name: 'Pending',  value: pendingProofs.length,  color: '#f59e0b' },
    { name: 'Rejected', value: rejectedProofs.length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // ── Revenue pie ───────────────────────────────────────────────────────────
  const revPie = [
    { name: 'Net Revenue',          value: Math.max(0, netRevenue),  color: '#6366f1' },
    { name: 'Recruiter Commission', value: totalRecruiterComm,       color: '#f59e0b' },
    { name: 'User Task Cost',       value: userTaskCost,             color: '#ef4444' },
  ].filter(d => d.value > 0);

  // ── Recruiter table ───────────────────────────────────────────────────────
  const recruiterRows = recruiters.map(r => {
    const rUsers = allUsers.filter(u => String(u.assigned_recruiter_id) === String(r.id) || String(u.created_by_recruiter_id) === String(r.id));
    const rSubs  = rUsers.filter(u => u.is_subscribed || u.free_unlock).length;
    const rApproved = approvedProofs.filter(p => rUsers.some(u => u.id === p.user_id)).length;
    const subComm  = rSubs * RATES.recruiterSubCommission;
    const taskComm = rApproved * RATES.recruiterTaskCommission;
    return { ...r, users: rUsers.length, subscribed: rSubs, approved: rApproved, subComm, taskComm, total: subComm + taskComm };
  });

  const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center gap-4">
          <Link to={createPageUrl("AdminPanel")}>
            <Button variant="outline" size="icon" className="border-gray-200">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time platform revenue & performance overview</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ── 1. Net Revenue Hero ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Net Revenue — large hero */}
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-7 text-white shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-indigo-200 mb-1">🏆 Net Platform Revenue</p>
              <p className="text-5xl font-black leading-tight">{fmt(Math.max(0, netRevenue))}</p>
              <p className="text-indigo-200 text-xs mt-2">After all commissions & payouts</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-indigo-200">Gross Revenue</p>
                <p className="font-bold text-lg">{fmt(grossRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-200">Total Deductions</p>
                <p className="font-bold text-lg text-red-300">{fmt(totalRecruiterComm + userTaskCost)}</p>
              </div>
            </div>
          </div>

          {/* KPI grid */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Gross Revenue"         value={fmt(grossRevenue)}            sub={`${activeSubscriptions.length} × ₹999`}   icon={TrendingUp}  color="bg-blue-500"   border="border-blue-100" />
            <StatCard label="Active Subscriptions"  value={activeSubscriptions.length}    sub={`${recruiterActiveSubs.length} via recruiters`} icon={CheckCircle} color="bg-green-500"  border="border-green-100" />
            <StatCard label="Recruiter Commissions" value={fmt(totalRecruiterComm)}       sub={`Sub: ${fmt(recruiterSubComm)} + Tasks: ${fmt(recruiterTaskComm)}`} icon={Award} color="bg-amber-500" border="border-amber-100" />
            <StatCard label="User Task Cost"        value={fmt(userTaskCost)}             sub={`${approvedProofs.length} approved × ₹100`} icon={TrendingDown} color="bg-rose-500" border="border-rose-100" />
            <StatCard label="Total Users"           value={allUsers.length}               sub={`${recruiterUsers.length} via recruiters`} icon={Users}  color="bg-violet-500" border="border-violet-100" />
            <StatCard label="Total Recruiters"      value={recruiters.length}              sub="Active platforms"   icon={UserPlus}    color="bg-cyan-500"   border="border-cyan-100" />
          </div>
        </div>

        {/* ── 2. Task Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-sm text-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <p className="text-3xl font-black text-green-600">{approvedProofs.length}</p>
            <p className="text-sm font-semibold text-gray-600 mt-1">Approved Tasks</p>
            <p className="text-xs text-gray-400 mt-1">{fmtFull(approvedProofs.length * 100)} earned by users</p>
          </div>
          <div className="bg-white border-2 border-amber-100 rounded-2xl p-5 shadow-sm text-center">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2"><Clock className="w-5 h-5 text-amber-600" /></div>
            <p className="text-3xl font-black text-amber-600">{pendingProofs.length}</p>
            <p className="text-sm font-semibold text-gray-600 mt-1">Pending Tasks</p>
            <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
          </div>
          <div className="bg-white border-2 border-red-100 rounded-2xl p-5 shadow-sm text-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2"><XCircle className="w-5 h-5 text-red-500" /></div>
            <p className="text-3xl font-black text-red-500">{rejectedProofs.length}</p>
            <p className="text-sm font-semibold text-gray-600 mt-1">Rejected Tasks</p>
            <p className="text-xs text-gray-400 mt-1">
              {proofs.length > 0 ? ((rejectedProofs.length / proofs.length) * 100).toFixed(1) : 0}% rejection rate
            </p>
          </div>
          <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-sm text-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2"><Activity className="w-5 h-5 text-indigo-600" /></div>
            <p className="text-3xl font-black text-indigo-600">{proofs.length}</p>
            <p className="text-sm font-semibold text-gray-600 mt-1">Total Submissions</p>
            <p className="text-xs text-gray-400 mt-1">
              {proofs.length > 0 ? ((approvedProofs.length / proofs.length) * 100).toFixed(1) : 0}% approval rate
            </p>
          </div>
        </div>

        {/* ── 3. Rate Config + Revenue Formula ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate Configuration */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900 text-lg">Revenue Configuration Rates</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-blue-700">₹999</p>
                  <p className="text-sm font-semibold text-blue-800 mt-1">Subscription Price</p>
                  <p className="text-xs text-blue-500 mt-0.5">per active subscription</p>
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-amber-700">₹200</p>
                  <p className="text-sm font-semibold text-amber-800 mt-1">Recruiter Sub Commission</p>
                  <p className="text-xs text-amber-500 mt-0.5">per recruited subscriber</p>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-orange-700">₹30</p>
                  <p className="text-sm font-semibold text-orange-800 mt-1">Recruiter Task Commission</p>
                  <p className="text-xs text-orange-500 mt-0.5">per approved task</p>
                </div>
                <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-rose-700">₹100</p>
                  <p className="text-sm font-semibold text-rose-800 mt-1">User Task Payout</p>
                  <p className="text-xs text-rose-500 mt-0.5">per approved task</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Formula Breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-gray-900 text-lg">Revenue Formula Breakdown</h2>
            </div>
            <div className="p-6">
              <RevenueRow
                label="Gross Revenue"
                value={grossRevenue}
                type="income"
                formula={`${activeSubscriptions.length} active subscriptions × ₹999`}
              />
              <RevenueRow
                label="Recruiter Sub Commission"
                value={recruiterSubComm}
                type="deduct"
                percent={grossRevenue ? ((recruiterSubComm/grossRevenue)*100).toFixed(1) : 0}
                formula={`${recruiterActiveSubs.length} recruited subscribers × ₹200`}
              />
              <RevenueRow
                label="Recruiter Task Commission"
                value={recruiterTaskComm}
                type="deduct"
                percent={grossRevenue ? ((recruiterTaskComm/grossRevenue)*100).toFixed(1) : 0}
                formula={`${recruiterApprovedTasks} approved tasks (recruiter users) × ₹30`}
              />
              <RevenueRow
                label="User Task Cost (Payouts)"
                value={userTaskCost}
                type="deduct"
                percent={grossRevenue ? ((userTaskCost/grossRevenue)*100).toFixed(1) : 0}
                formula={`${approvedProofs.length} total approved tasks × ₹100`}
              />
              <div className="mt-4 pt-2">
                <RevenueRow
                  label="Net Platform Revenue"
                  value={Math.max(0, netRevenue)}
                  type="net"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Task Trend */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">📈 Daily Task Trend (Last 7 Days)</h2>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="approved" stroke="#22c55e" fill="url(#gA)" strokeWidth={2} name="Approved" />
                  <Area type="monotone" dataKey="rejected" stroke="#ef4444" fill="url(#gR)" strokeWidth={2} name="Rejected" />
                  <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={false} name="Pending" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">👥 User Registrations (Last 7 Days)</h2>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dailyTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="newUsers" fill="#6366f1" radius={[6, 6, 0, 0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── 5. Pie Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">💹 Revenue Breakdown</h2>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={revPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {revPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtFull(v)} contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">📋 Task Status Distribution</h2>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── 6. Task Type & Recruiter Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">📊 Task Type Performance</h2>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={taskTypeData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="approved" stackId="a" fill="#22c55e" name="Approved" />
                  <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                  <Bar dataKey="pending"  stackId="a" fill="#f59e0b" name="Pending" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">🏆 Top Users — Approved Tasks Leaderboard</h2>
            </div>
            <div className="p-4">
              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((u, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                          <span className="text-xs font-bold text-green-600 ml-2">{fmtFull(u.amount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-indigo-500 rounded-full h-1.5" style={{ width: `${leaderboard[0].count > 0 ? (u.count / leaderboard[0].count) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">{u.count} tasks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">No approved tasks yet</div>
              )}
            </div>
          </div>
        </div>

        {/* ── 7. Conversion Funnel ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg">🔽 Platform Conversion Funnel</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Registered Users', value: allUsers.length, color: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
                { label: 'Subscribed Users', value: activeSubscriptions.length, color: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
                { label: 'Task Submitted',   value: [...new Set(proofs.map(p => p.user_id))].length, color: '#06b6d4', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
                { label: 'Task Approved',    value: [...new Set(approvedProofs.map(p => p.user_id))].length, color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
              ].map((stage, i, arr) => {
                const pct = allUsers.length > 0 ? ((stage.value / allUsers.length) * 100).toFixed(1) : 0;
                const conv = i > 0 && arr[i-1].value > 0 ? ((stage.value / arr[i-1].value) * 100).toFixed(1) : null;
                return (
                  <div key={i} className={`${stage.bg} border-2 ${stage.border} rounded-2xl p-5 text-center`}>
                    <p className={`text-4xl font-black ${stage.text}`}>{stage.value}</p>
                    <p className={`text-sm font-semibold mt-1 ${stage.text}`}>{stage.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{pct}% of total</p>
                    {conv && (
                      <div className={`mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${stage.bg} border ${stage.border} ${stage.text}`}>
                        {conv}% conversion
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 8. Recruiter Commission Table ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg">📋 Recruiter Commission Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-gray-600 font-semibold py-3 px-5">Recruiter</th>
                  <th className="text-center text-gray-600 font-semibold py-3 px-4">Total Users</th>
                  <th className="text-center text-gray-600 font-semibold py-3 px-4">Subscribed</th>
                  <th className="text-center text-gray-600 font-semibold py-3 px-4">Approved Tasks</th>
                  <th className="text-right text-gray-600 font-semibold py-3 px-4">Sub Commission</th>
                  <th className="text-right text-gray-600 font-semibold py-3 px-4">Task Commission</th>
                  <th className="text-right text-indigo-600 font-bold py-3 px-5">Total Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recruiterRows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5 font-semibold text-gray-900">{r.name}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{r.users}</td>
                    <td className="py-3 px-4 text-center"><span className="inline-block bg-green-100 text-green-700 font-bold text-xs px-2 py-0.5 rounded-full">{r.subscribed}</span></td>
                    <td className="py-3 px-4 text-center"><span className="inline-block bg-blue-100 text-blue-700 font-bold text-xs px-2 py-0.5 rounded-full">{r.approved}</span></td>
                    <td className="py-3 px-4 text-right text-amber-600 font-medium">{fmtFull(r.subComm)}</td>
                    <td className="py-3 px-4 text-right text-orange-600 font-medium">{fmtFull(r.taskComm)}</td>
                    <td className="py-3 px-5 text-right font-black text-indigo-700 text-base">{fmtFull(r.total)}</td>
                  </tr>
                ))}
                {recruiterRows.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">No recruiters yet</td></tr>
                )}
                {recruiterRows.length > 0 && (
                  <tr className="bg-indigo-50 border-t-2 border-indigo-200 font-bold">
                    <td className="py-3 px-5 text-indigo-800">TOTAL</td>
                    <td className="py-3 px-4 text-center text-indigo-700">{recruiterRows.reduce((s, r) => s + r.users, 0)}</td>
                    <td className="py-3 px-4 text-center text-indigo-700">{recruiterRows.reduce((s, r) => s + r.subscribed, 0)}</td>
                    <td className="py-3 px-4 text-center text-indigo-700">{recruiterRows.reduce((s, r) => s + r.approved, 0)}</td>
                    <td className="py-3 px-4 text-right text-amber-700">{fmtFull(recruiterRows.reduce((s, r) => s + r.subComm, 0))}</td>
                    <td className="py-3 px-4 text-right text-orange-700">{fmtFull(recruiterRows.reduce((s, r) => s + r.taskComm, 0))}</td>
                    <td className="py-3 px-5 text-right text-indigo-800 text-base">{fmtFull(recruiterRows.reduce((s, r) => s + r.total, 0))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
