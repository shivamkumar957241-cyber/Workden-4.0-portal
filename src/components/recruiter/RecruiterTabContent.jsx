import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, CheckCircle, BarChart3, XCircle, Monitor, Smartphone, Shield, Globe, Activity, Zap, TrendingUp, LogOut, RefreshCw, Eye, Clock, UserPlus, Star, Award } from "lucide-react";
import RecruiterActivityTab from "@/components/recruiter/RecruiterActivityTab";
import { base44 } from "@/api/base44Client";

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

const SectionCard = ({ title, icon: Icon, count, children, actions, gradient }) => (
  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
    <div className={`px-5 py-4 flex items-center gap-2.5 ${gradient || 'bg-gradient-to-r from-slate-800 to-slate-700'}`}>
      {Icon && <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-white" /></div>}
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {count !== undefined && <span className="ml-1 text-xs font-semibold bg-white/20 text-white rounded-full px-2.5 py-0.5">{count}</span>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

export default function RecruiterTabContent({
  activeTab, filteredUsers, filteredProofsDisplay, proofs, assignedUsers, subscriptionPayments, withdrawals,
  dateFilter, setDateFilter, customStart, setCustomStart, customEnd, setCustomEnd,
  statusFilter, setStatusFilter, userRecruiterFilter, setUserRecruiterFilter, tagFilter, setTagFilter,
  userSearch, setUserSearch, getUserTag, setAssignRecruiterUser, setAssignRecruiterName, setAssignRecruiterDialog,
  recruiter, setDeleteConfirmUser,
  taskStatusFilter, setTaskStatusFilter, taskSearch, setTaskSearch, taskRecruiterFilter, setTaskRecruiterFilter,
  taskDateStart, setTaskDateStart, taskDateEnd, setTaskDateEnd, expandedProofId, setViewingPerf, setPerfSummaryDialog, setViewingProofData,
  liveActivities, activityHistory, activitySearch, setActivitySearch, lastActivityRefresh, nowTick, timeSinceStr, fmtDur,
  viewingLiveActivity, setViewingLiveActivity, viewingHistoryActivity, setViewingHistoryActivity,
  deleteConfirm, setDeleteConfirm, onDeleteConfirm,
  deviceSearch, setDeviceSearch, deviceOfflineFilter, setDeviceOfflineFilter, filterByOfflineDuration, getTimeSince, forceLogoutLoading, handleForceLogout, loadData,
  proofs: allProofs, approvedAll, rejectedAll, overallApprovalRate, sortedTasks, topTask,
  perfSearchQuery, setPerfSearchQuery, perfMonthFilter, setPerfMonthFilter, setReportUser, setReportDialog,
  analyticsTab, setAnalyticsTab, AnalyticsFunnel, AnalyticsCharts,
  referralPartners,
}) {
  return (
    <>
      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (() => {
        const onlineUsers = assignedUsers.filter(u => isReallyOnline(u));
        const subscribedUsers = assignedUsers.filter(u => u.is_subscribed);
        const pendingProofs = (allProofs || []).filter(p => p.status === 'pending');
        const approvedProofs = (allProofs || []).filter(p => p.status === 'approved');
        const rejectedProofs = (allProofs || []).filter(p => p.status === 'rejected');
        const approvalRate = allProofs?.length > 0 ? Math.round((approvedProofs.length / allProofs.length) * 100) : 0;

        // Today's submissions
        const todayStr = new Date().toLocaleDateString('en-CA');
        const todayProofs = (allProofs || []).filter(p => {
          const d = new Date(p.submitted_date || p.created_date).toLocaleDateString('en-CA');
          return d === todayStr;
        });

        // Recent users (last 5)
        const recentUsers = [...assignedUsers].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

        // Recent submissions (last 5)
        const recentProofs = [...(allProofs || [])].sort((a, b) => new Date(b.submitted_date || b.created_date) - new Date(a.submitted_date || a.created_date)).slice(0, 5);

        // Top earner
        const topEarner = [...assignedUsers].sort((a, b) => (b.wallet_balance || 0) - (a.wallet_balance || 0))[0];

        return (
          <div className="space-y-5">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Welcome back,</p>
                  <h2 className="text-2xl font-black mt-0.5">{recruiter?.name} 👋</h2>
                  <p className="text-white/60 text-xs mt-1">Code: {recruiter?.recruiter_code} &nbsp;•&nbsp; {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-black shadow-inner">
                  {recruiter?.name?.[0]?.toUpperCase() || 'R'}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Total Users', value: assignedUsers.length, icon: '👥' },
                  { label: 'Subscribed', value: subscribedUsers.length, icon: '✅' },
                  { label: 'Online Now', value: onlineUsers.length, icon: '🟢' },
                  { label: "Today's Tasks", value: todayProofs.length, icon: '📋' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                    <p className="text-lg">{icon}</p>
                    <p className="text-xl font-black">{value}</p>
                    <p className="text-[10px] text-white/70 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Task Overview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-gray-800">Task Overview</h3>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'Pending Review', value: pendingProofs.length, color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Approved', value: approvedProofs.length, color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Rejected', value: rejectedProofs.length, color: 'bg-red-500', textColor: 'text-red-600', bg: 'bg-red-50' },
                  ].map(({ label, value, color, textColor, bg }) => {
                    const pct = allProofs?.length > 0 ? Math.round((value / allProofs.length) * 100) : 0;
                    return (
                      <div key={label} className={`${bg} rounded-xl p-3`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-semibold text-gray-700">{label}</span>
                          <span className={`text-sm font-black ${textColor}`}>{value}</span>
                        </div>
                        <div className="w-full bg-white/60 rounded-full h-2">
                          <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{pct}% of total</p>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-1 px-1">
                    <span className="text-xs text-gray-500">Overall Approval Rate</span>
                    <span className={`text-sm font-black ${approvalRate >= 70 ? 'text-emerald-600' : approvalRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{approvalRate}%</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-gray-800">Quick Stats</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Conversion Rate', value: assignedUsers.length > 0 ? Math.round((subscribedUsers.length / assignedUsers.length) * 100) + '%' : '0%', icon: TrendingUp, grad: 'from-violet-500 to-purple-600' },
                    { label: 'Referral Partners', value: referralPartners?.length || 0, icon: Star, grad: 'from-pink-500 to-rose-500' },
                    { label: 'Active Tasks Today', value: liveActivities?.length || 0, icon: Activity, grad: 'from-cyan-500 to-sky-600' },
                    { label: 'Top Earner Balance', value: topEarner ? `₹${(Number(topEarner.wallet_balance || 0) || 0).toFixed(0)}` : '₹0', icon: Award, grad: 'from-amber-500 to-orange-500' },
                  ].map(({ label, value, icon: Icon, grad }) => (
                    <div key={label} className={`bg-gradient-to-br ${grad} rounded-xl p-3.5 text-white`}>
                      <Icon className="w-4 h-4 text-white/80 mb-1.5" />
                      <p className="text-lg font-black">{value}</p>
                      <p className="text-[10px] text-white/70 font-medium leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Recent Users */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-800">Recent Users</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentUsers.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">No users yet</p>
                  ) : recentUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.phone || u.email || u.login_user_id}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${u.is_subscribed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_subscribed ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-gray-800">Recent Submissions</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentProofs.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">No submissions yet</p>
                  ) : recentProofs.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${p.status === 'approved' ? 'bg-emerald-500' : p.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.user_name}</p>
                        <p className="text-xs text-gray-400 truncate">{p.work_type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-emerald-600">₹{p.reward_amount || 0}</p>
                        <p className={`text-[10px] font-medium capitalize ${p.status === 'approved' ? 'text-emerald-600' : p.status === 'rejected' ? 'text-red-500' : 'text-amber-600'}`}>{p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <SectionCard title="My Created Users" icon={Users} count={filteredUsers.length} gradient="bg-gradient-to-r from-blue-700 to-indigo-700">
          <div className="px-4 py-3 border-b border-gray-50 space-y-2.5">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-gray-500">Join Date:</span>
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:border-blue-400">
                {[["all","All Time"],["today","Today"],["yesterday","Yesterday"],["last2days","Last 2 Days"],["lastweek","Last Week"],["lastmonth","Last Month"],["custom","Custom"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {dateFilter === "custom" && <>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
                <span className="text-gray-400 text-xs">to</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
              </>}
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:border-blue-400">
                <option value="all">All Status</option>
                <option value="subscribed">Subscribed</option>
                <option value="not_subscribed">Not Subscribed</option>
              </select>
              <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:border-blue-400">
                <option value="all">All Tags</option>
                <option value="Normal">Normal</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
              {(() => {
                const rnames = [...new Set(assignedUsers.map(u => u.assigned_recruiter_name).filter(Boolean))];
                return rnames.length > 0 ? (
                  <select value={userRecruiterFilter} onChange={e => setUserRecruiterFilter(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700">
                    <option value="all">All Recruiters</option>
                    {rnames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                ) : null;
              })()}
              <input placeholder="Search by name, email, phone, ID..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 min-w-[200px]" />
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredUsers.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    {["Name","Recruiter","User ID","Password","City","Subscription","Sub Date","Total","Approved","Rejected","Pending","Tag","Earnings","Withdrawn","W.Req","Last Active","Action"].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => {
                    const userProofs = proofs.filter(p => String(p.user_id) === String(u.id));
                    const allSubForUser = subscriptionPayments.filter(s => String(s.user_id) === String(u.id));
                    const subPayment = allSubForUser.find(s => s.status === 'approved');
                    const subDate = u.subscription_activation_date || u.subscription_date || subPayment?.approved_date || subPayment?.created_date || null;
                    const tag = getUserTag(u.id);
                    const userWithdrawals = withdrawals.filter(w => String(w.user_id) === String(u.id));
                    const totalWd = userWithdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + (w.amount || 0), 0);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{u.full_name}</td>
                        <td className="px-3 py-2.5 text-xs text-indigo-600 font-medium">{u.assigned_recruiter_name || '—'}</td>
                        <td className="px-3 py-2.5 font-mono text-blue-600 text-xs">{u.login_user_id || '—'}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{u.login_password || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{u.city || '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${u.is_subscribed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                            {u.is_subscribed ? '✓ Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">
                          {subDate ? <span className="text-emerald-700 font-medium">{new Date(subDate).toLocaleDateString('en-IN')}</span>
                            : u.is_subscribed ? <span className="text-amber-600 text-xs">⚠️ Re-activate</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-blue-600 text-center">{userProofs.length}</td>
                        <td className="px-3 py-2.5 font-semibold text-emerald-600 text-center">{userProofs.filter(p => p.status === 'approved').length}</td>
                        <td className="px-3 py-2.5 font-semibold text-red-500 text-center">{userProofs.filter(p => p.status === 'rejected').length}</td>
                        <td className="px-3 py-2.5 font-semibold text-amber-600 text-center">{userProofs.filter(p => p.status === 'pending').length}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-medium text-white px-2 py-0.5 rounded-full ${tag.color}`}>{tag.label}</span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-emerald-700 text-xs">₹{((Number(u.wallet_balance) || 0) + (Number(u.total_withdrawals) || 0)).toFixed(0)}</td>
                        <td className="px-3 py-2.5 font-semibold text-red-500 text-xs">₹{(Number(u.total_withdrawals) || 0).toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-center text-xs font-medium text-purple-600">{userWithdrawals.length}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-400">{u.last_active ? new Date(u.last_active).toLocaleString() : '—'}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => { setAssignRecruiterUser(u); setAssignRecruiterName(u.assigned_recruiter_name || recruiter?.name || ''); setAssignRecruiterDialog(true); }}
                              className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors whitespace-nowrap">✏️ Edit</button>
                            <button onClick={() => setDeleteConfirmUser(u)}
                              className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-medium transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-14 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No users found. Create your first user above.</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <SectionCard title="Task Submissions" icon={BarChart3} count={filteredProofsDisplay.length} gradient="bg-gradient-to-r from-emerald-700 to-teal-700">
          
          {/* STATS BOXES */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Tasks", value: allProofs?.length || 0, color: "text-white", bg: "bg-gradient-to-br from-blue-500 to-indigo-600 border-transparent", labelColor: "text-blue-100" },
                { label: "Approved Tasks", value: (allProofs || []).filter(p => p.status === 'approved').length, color: "text-white", bg: "bg-gradient-to-br from-emerald-500 to-green-600 border-transparent", labelColor: "text-emerald-100" },
                { label: "Pending Tasks", value: (allProofs || []).filter(p => p.status === 'pending').length, color: "text-white", bg: "bg-gradient-to-br from-amber-500 to-orange-500 border-transparent", labelColor: "text-amber-100" },
                { label: "Rejected Tasks", value: (allProofs || []).filter(p => p.status === 'rejected').length, color: "text-white", bg: "bg-gradient-to-br from-rose-500 to-red-600 border-transparent", labelColor: "text-rose-100" },
              ].map((stat, i) => (
                <div key={i} className={`p-3 border rounded-xl text-center shadow-md ${stat.bg}`}>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className={`text-xs font-medium mt-0.5 ${stat.labelColor}`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-gray-50 space-y-2.5">
            <div className="flex flex-wrap gap-2 items-center">
              <select value={taskStatusFilter} onChange={e => setTaskStatusFilter(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:border-blue-400">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <input placeholder="Search by user, task..." value={taskSearch} onChange={e => setTaskSearch(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 min-w-[180px]" />
              <input placeholder="Filter recruiter..." value={taskRecruiterFilter} onChange={e => setTaskRecruiterFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 w-[150px]" />
              <div className="flex gap-1 flex-wrap">
                {[
                  { label: "Today", fn: () => { const t = new Date().toISOString().split('T')[0]; setTaskDateStart(t); setTaskDateEnd(t); }},
                  { label: "Yesterday", fn: () => { const d = new Date(); d.setDate(d.getDate()-1); const t = d.toISOString().split('T')[0]; setTaskDateStart(t); setTaskDateEnd(t); }},
                  { label: "Last Week", fn: () => { const d = new Date(); d.setDate(d.getDate()-7); setTaskDateStart(d.toISOString().split('T')[0]); setTaskDateEnd(new Date().toISOString().split('T')[0]); }},
                  { label: "Last Month", fn: () => { const d = new Date(); d.setMonth(d.getMonth()-1); setTaskDateStart(d.toISOString().split('T')[0]); setTaskDateEnd(new Date().toISOString().split('T')[0]); }},
                ].map(({ label, fn }) => (
                  <button key={label} onClick={fn} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md font-medium transition-colors">{label}</button>
                ))}
                {(taskDateStart || taskDateEnd) && <button onClick={() => { setTaskDateStart(""); setTaskDateEnd(""); }} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 rounded-md font-medium">✕ Clear</button>}
              </div>
              <input type="date" value={taskDateStart} onChange={e => setTaskDateStart(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
              <span className="text-gray-400 text-xs">to</span>
              <input type="date" value={taskDateEnd} onChange={e => setTaskDateEnd(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredProofsDisplay.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    {["Recruiter","User Details","Task","Reward","Status","Rejection Reason","Performance","Date"].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProofsDisplay.slice(0, 200).flatMap((p) => {
                    const user = assignedUsers.find(u => String(u.id) === String(p.user_id));
                    let bd = p.behavior_data; if (typeof bd === 'string') { try { bd = JSON.parse(bd); } catch(e) { bd = null; } }
                    let items = []; if (p.csv_data) { try { const c = typeof p.csv_data==='string'?JSON.parse(p.csv_data):p.csv_data; if(Array.isArray(c)) items=c; } catch(e){} }
                    if (!items.length && p.task_data) { try { const d = typeof p.task_data==='string'?JSON.parse(p.task_data):p.task_data; items=d.entries||d.forms||d.corrections||d.pages||[]; } catch(e){} }
                    const statusColor = p.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : p.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200';
                    const mainRow = (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-indigo-600 font-medium">{user?.assigned_recruiter_name || '—'}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-900 text-sm">{p.user_name}</p>
                          {user?.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                          {user?.city && <p className="text-xs text-gray-400">{user.city}</p>}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-gray-700 font-medium text-sm">{p.work_type}</p>
                          {(() => { const m = (p.work_type||'').match(/(\d+)$/); return m ? <span className="text-xs text-indigo-500">Task {m[1]}</span> : null; })()}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-emerald-700">₹{p.reward_amount || 0}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>{p.status}</span>
                        </td>
                        <td className="px-3 py-2.5" style={{ minWidth: 160, maxWidth: 240 }}>
                          {p.status === 'rejected' && p.rejection_reason ? (() => {
                            const ur = /(https?:\/\/[^\s]+)/g;
                            const m = p.rejection_reason.match(ur);
                            return (<div className="p-1.5 bg-red-50 border border-red-100 rounded text-red-600 text-xs">
                              <p>{p.rejection_reason.replace(ur,'').trim()}</p>
                              {m && <a href={m[0]} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View Report</a>}
                            </div>);
                          })() : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2.5" style={{ minWidth: 140 }}>
                          <div className="flex flex-col gap-1">
                            {p.performance_summary && <button onClick={() => { setViewingPerf(p); setPerfSummaryDialog(true); }} className="px-2 py-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded hover:bg-amber-100 flex items-center gap-1"><BarChart3 className="w-3 h-3" />Perf</button>}
                            <button onClick={() => setViewingProofData(p)} className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded hover:bg-slate-100 flex items-center gap-1"><Eye className="w-3 h-3" />Data</button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{new Date(p.submitted_date || p.created_date).toLocaleDateString()}</td>
                      </tr>
                    );
                    if (expandedProofId !== p.id) return [mainRow];
                    const detailRow = (
                      <tr key={`d-${p.id}`}><td colSpan={8} className="px-4 py-3 bg-slate-50 border-b border-gray-100">
                        <p className="font-semibold text-sm text-gray-700 mb-2">{p.user_name} — {p.work_type}</p>
                        {bd && Object.keys(bd).length > 0 && (
                          <div className="mb-2 p-2.5 rounded-lg bg-slate-800">
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
                              {[{l:'Chars',v:bd.chars_typed??0},{l:'Words',v:bd.words??0},{l:'WPM',v:bd.wpm??0},{l:'Saved',v:`${bd.saved_count??0}/${bd.total??0}`},{l:'Pasted',v:bd.pasted_chars??0,red:true},{l:'Pastes',v:bd.paste_attempts??0,red:true},{l:'Tab',v:bd.tab_switches??0},{l:'Back',v:bd.backspaces??0}].map((m,i)=>(
                                <div key={i} className={`rounded p-1.5 ${m.red?'border border-red-500':'border border-slate-600'}`} style={{background:m.red?'#1e293b':'#334155'}}><p style={{fontSize:9,color:m.red?'#fca5a5':'#94a3b8'}}>{m.l}</p><p style={{fontWeight:800,fontSize:12,color:m.red?'#ef4444':'#f1f5f9'}}>{String(m.v)}</p></div>
                              ))}
                            </div>
                          </div>
                        )}
                        {items.length > 0 && <div><p className="text-xs font-semibold text-gray-600 mb-1.5">Submitted Data ({items.length} items)</p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {items.slice(0,10).map((item,idx)=>(<div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
                              <div className="bg-indigo-500 px-3 py-1 flex items-center gap-2"><span className="text-white text-xs font-semibold">Entry #{item.id||idx+1}</span></div>
                              <div className="bg-white p-1.5 grid grid-cols-2 md:grid-cols-3 gap-1">{Object.entries(item).filter(([k])=>k!=='id'&&!k.endsWith('_saved_at')&&!k.startsWith('_')).map(([key,val])=>(<div key={key} className="text-xs"><span className="text-gray-400">{key}: </span><span className="font-medium text-gray-700">{String(val||'—')}</span></div>))}</div>
                            </div>))}
                            {items.length > 10 && <p className="text-xs text-gray-400 text-center">+{items.length-10} more</p>}
                          </div>
                        </div>}
                      </td></tr>
                    );
                    return [mainRow, detailRow];
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-14 text-gray-400"><BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p className="text-sm">No task submissions found</p></div>
            )}
          </div>
        </SectionCard>
      )}

      {/* LIVE ACTIVITY */}
      {activeTab === 'activity' && (
        <RecruiterActivityTab
          liveActivities={liveActivities} activityHistory={activityHistory}
          activitySearch={activitySearch} setActivitySearch={setActivitySearch}
          lastActivityRefresh={lastActivityRefresh} nowTick={nowTick}
          timeSinceStr={timeSinceStr} fmtDur={fmtDur}
          viewingLiveActivity={viewingLiveActivity} setViewingLiveActivity={setViewingLiveActivity}
          viewingHistoryActivity={viewingHistoryActivity} setViewingHistoryActivity={setViewingHistoryActivity}
          deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm}
          onDeleteConfirm={onDeleteConfirm}
        />
      )}

      {/* DEVICES TAB */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Activity, label: "Online Users", value: assignedUsers.filter(u => isReallyOnline(u)).length, grad: "from-emerald-500 to-teal-600" },
              { icon: Smartphone, label: "Offline Users", value: assignedUsers.filter(u => !isReallyOnline(u)).length, grad: "from-slate-500 to-gray-600" },
              { icon: Shield, label: "Total Users", value: assignedUsers.length, grad: "from-blue-600 to-indigo-700" },
              { icon: LogOut, label: "Logged Out", value: assignedUsers.filter(u => !u.is_logged_in).length, grad: "from-red-500 to-rose-600" },
            ].map(({ icon: Icon, label, value, grad }) => (
              <div key={label} className={`bg-gradient-to-br ${grad} rounded-2xl p-4 flex items-center gap-3 shadow-md text-white`}>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div><p className="text-xs text-white/70 font-medium">{label}</p><p className="text-2xl font-bold">{value}</p></div>
              </div>
            ))}
          </div>
          <SectionCard title="All Users — Login Status" icon={Globe} gradient="bg-gradient-to-r from-violet-700 to-purple-700" actions={
            <button onClick={() => loadData(recruiter)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />Refresh
            </button>
          }>
            <div className="px-4 py-3 border-b border-gray-50 space-y-2">
              <input placeholder="Search by name, phone, email..." value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 min-w-[220px]" />
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-gray-500 font-medium">Offline Filter:</span>
                {[['all','All'],['1d','1 Day'],['2d','2 Days'],['3d','3 Days'],['7d','7 Days'],['15d','15 Days'],['30d','30+ Days']].map(([val, label]) => (
                  <button key={val} onClick={() => setDeviceOfflineFilter(val)}
                    className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${deviceOfflineFilter === val ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>{["User","Login ID","Contact","Status","Device","Last Active","Actions"].map(h => <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assignedUsers.filter(u => {
                    if (!filterByOfflineDuration(u)) return false;
                    if (!deviceSearch.trim()) return true;
                    const s = deviceSearch.toLowerCase();
                    return u.full_name?.toString()?.toLowerCase()?.includes(s) || u.phone?.toString()?.toLowerCase()?.includes(s) || u.email?.toString()?.toLowerCase()?.includes(s) || u.login_user_id?.toString()?.toLowerCase()?.includes(s);
                  }).sort((a, b) => (isReallyOnline(b)?1:0) - (isReallyOnline(a)?1:0)).map(user => {
                    const online = isReallyOnline(user);
                    return (
                      <tr key={user.id} className={online ? 'bg-emerald-50/40' : 'hover:bg-gray-50'}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${online ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                            <div><p className="font-medium text-sm text-gray-900">{user.full_name}</p><p className="text-xs text-gray-400">{user.city || '—'}</p></div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5"><p className="font-mono text-blue-600 text-xs">{user.login_user_id}</p><p className="font-mono text-xs text-gray-400">{user.login_password}</p></td>
                        <td className="px-3 py-2.5 text-xs text-gray-500"><p>{user.phone || '—'}</p><p>{user.email || '—'}</p></td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${online ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{online ? '● Online' : '○ Offline'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{user.device_name || user.device_type ? `${getDeviceIcon(user.device_type)} ${user.device_name || user.device_type}` : user.session_id ? user.session_id.substring(0,10)+'...' : '—'}</td>
                        <td className="px-3 py-2.5 text-xs"><p className="font-medium text-gray-600">{getTimeSince(user.last_heartbeat || user.last_active)}</p><p className="text-gray-400">{user.last_heartbeat ? new Date(user.last_heartbeat).toLocaleString() : user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}</p></td>
                        <td className="px-3 py-2.5">
                          {user.is_logged_in && (
                            <button onClick={() => handleForceLogout(user)} disabled={forceLogoutLoading === user.id}
                              className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md font-medium transition-colors flex items-center gap-1 disabled:opacity-50">
                              <LogOut className="w-3 h-3" />{forceLogoutLoading === user.id ? 'Logging out...' : 'Force Logout'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {assignedUsers.length === 0 && <div className="text-center py-12 text-gray-400"><Monitor className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p className="text-sm">No users created yet</p></div>}
            </div>
          </SectionCard>
        </div>
      )}

      {/* PERFORMANCE TAB */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Total Submissions', value:allProofs.length, grad:'from-blue-600 to-indigo-700' },
              { label:'Total Approved', value:approvedAll.length, grad:'from-emerald-500 to-teal-600' },
              { label:'Total Rejected', value:rejectedAll.length, grad:'from-red-500 to-rose-600' },
              { label:'Approval Rate', value:overallApprovalRate+'%', grad:'from-violet-600 to-purple-700' },
            ].map(({ label, value, grad }) => (
              <div key={label} className={`bg-gradient-to-br ${grad} rounded-2xl p-4 text-white shadow-md`}>
                <p className="text-xs text-white/70 font-medium mb-1">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <SectionCard title="Task Popularity Trends" icon={BarChart3} gradient="bg-gradient-to-r from-orange-600 to-amber-600">
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-400">Most popular: <span className="font-semibold text-gray-600">{topTask}</span></p>
              {sortedTasks.map(([taskName, count]) => {
                const pct = allProofs.length > 0 ? Math.round((count/allProofs.length)*100) : 0;
                const approved = allProofs.filter(p => p.work_type === taskName && p.status === 'approved').length;
                return (
                  <div key={taskName}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{taskName}</span>
                      <span className="text-gray-400">{count} ({pct}%) • ✅ {approved}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
              {sortedTasks.length === 0 && <p className="text-gray-400 text-center py-4 text-sm">No submissions yet</p>}
            </div>
          </SectionCard>
          <SectionCard title="User-wise Performance" icon={Users} gradient="bg-gradient-to-r from-cyan-700 to-blue-700">
            <div className="px-4 py-3 border-b border-gray-50 flex flex-wrap gap-2">
              <input placeholder="Search users..." value={perfSearchQuery} onChange={e => setPerfSearchQuery(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 min-w-[180px]" />
              <input type="month" value={perfMonthFilter} onChange={e => setPerfMonthFilter(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
              <button onClick={() => setPerfMonthFilter('')} className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium">All Time</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>{["User","Tag","Total","✅","❌","⏳","Rate","Top Task","Report"].map(h => <th key={h} className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-left whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assignedUsers.filter(u => {
                    if (!perfSearchQuery.trim()) return true;
                    const s = perfSearchQuery.toLowerCase();
                    return u.full_name?.toString()?.toLowerCase()?.includes(s) || u.phone?.toString()?.toLowerCase()?.includes(s) || u.email?.toString()?.toLowerCase()?.includes(s) || u.login_user_id?.toString()?.toLowerCase()?.includes(s);
                  }).map(u => {
                    let up = allProofs.filter(p => String(p.user_id) === String(u.id));
                    if (perfMonthFilter) { const [yr, mo] = perfMonthFilter.split('-').map(Number); const start = new Date(yr, mo-1, 1), end = new Date(yr, mo, 0, 23, 59, 59); up = up.filter(p => { const d = new Date(p.submitted_date || p.created_date); return d >= start && d <= end; }); }
                    const ua = up.filter(p => p.status === 'approved').length;
                    const ur = up.filter(p => p.status === 'rejected').length;
                    const upend = up.filter(p => p.status === 'pending').length;
                    const rate = up.length > 0 ? Math.round((ua/up.length)*100) : 0;
                    const tc = {}; up.forEach(p => { tc[p.work_type] = (tc[p.work_type]||0)+1; }); const topT = Object.entries(tc).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
                    const tag = getUserTag(u.id);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5"><p className="font-medium text-gray-900">{u.full_name}</p>{u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}</td>
                        <td className="px-3 py-2.5"><span className={`text-xs font-medium text-white px-2 py-0.5 rounded-full ${tag.color}`}>{tag.label}</span></td>
                        <td className="px-3 py-2.5 text-center font-semibold text-blue-600">{up.length}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-emerald-600">{ua}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-red-500">{ur}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-amber-600">{upend}</td>
                        <td className="px-3 py-2.5 text-center"><span className={`font-bold text-sm ${rate>=70?'text-emerald-600':rate>=40?'text-amber-600':'text-red-500'}`}>{rate}%</span></td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{topT}</td>
                        <td className="px-3 py-2.5"><button onClick={() => { setReportUser({ user: u, userProofs: allProofs.filter(p => String(p.user_id) === String(u.id)) }); setReportDialog(true); }} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">Report</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {assignedUsers.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No users yet</p>}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-4 bg-gradient-to-r from-slate-800 to-indigo-900">
            <h2 className="text-sm font-semibold text-white">🔬 Analytics Dashboard</h2>
            <div className="flex gap-1.5">
              {[{key:'funnel',label:'Funnel & KPIs'},{key:'charts',label:'Charts & Trends'}].map(({key,label}) => (
                <button key={key} onClick={() => setAnalyticsTab(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${analyticsTab===key?'bg-white text-slate-800':'bg-white/15 text-white hover:bg-white/25'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="p-5">{analyticsTab === 'funnel' ? <AnalyticsFunnel /> : <AnalyticsCharts />}</div>
        </div>
      )}

      {/* REFERRAL PARTNERS TAB */}
      {activeTab === 'referralpartners' && (
        <SectionCard title="Referral Partner Applications" count={referralPartners.length} gradient="bg-gradient-to-r from-pink-600 to-rose-600">
          <div className="p-4 space-y-3">
            {referralPartners.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><p className="text-sm">No referral partner applications from your users yet</p></div>
            ) : referralPartners.map(partner => {
              const user = assignedUsers.find(u => String(u.id) === String(partner.user_id));
              const statusColor = partner.status === 'approved' ? 'border-emerald-200 bg-emerald-50' : partner.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50';
              const statusBadge = partner.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : partner.status === 'rejected' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200';
              return (
                <div key={partner.id} className={`p-4 rounded-xl border ${statusColor}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{partner.full_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{partner.phone}{partner.email ? ` • ${partner.email}` : ''}</p>
                      {partner.city && <p className="text-xs text-gray-400">{partner.city}</p>}
                      {user && <p className="text-xs text-blue-500 mt-1">{user.login_user_id}</p>}
                      <p className="text-xs text-gray-400 mt-1">Applied: {new Date(partner.created_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge}`}>{partner.status === 'approved' ? '✓ Approved' : partner.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                {recruiter?.name?.[0]?.toUpperCase() || 'R'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{recruiter?.name || '—'}</h2>
                <p className="text-sm text-gray-500">Recruiter</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${recruiter?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${recruiter?.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                  {recruiter?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Mobile</span>
                <span className="text-sm font-semibold text-gray-900">{recruiter?.mobile || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-semibold text-gray-900 truncate ml-4">{recruiter?.email || '—'}</span>
              </div>
              {recruiter?.recruiter_code && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Recruiter Code</span>
                  <span className="text-sm font-bold font-mono text-indigo-600">{recruiter.recruiter_code}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
