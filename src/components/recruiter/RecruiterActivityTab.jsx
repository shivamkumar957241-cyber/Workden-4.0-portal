import React from "react";
import { Activity, Clock, Zap, Eye, Trash2, X, AlertTriangle } from "lucide-react";

export default function RecruiterActivityTab({ liveActivities, activityHistory, activitySearch, setActivitySearch, lastActivityRefresh, nowTick, timeSinceStr, fmtDur, viewingLiveActivity, setViewingLiveActivity, viewingHistoryActivity, setViewingHistoryActivity, deleteConfirm, setDeleteConfirm, onDeleteConfirm }) {
  const avatarPalette = [
    { bg: '#E6F1FB', color: '#0C447C' }, { bg: '#EAF3DE', color: '#27500A' },
    { bg: '#EEEDFE', color: '#3C3489' }, { bg: '#E1F5EE', color: '#085041' },
    { bg: '#FAEEDA', color: '#633806' }, { bg: '#FBEAF0', color: '#72243E' },
  ];
  const getInitials = (name) => (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getAvatar = (name) => avatarPalette[(name || '').charCodeAt(0) % avatarPalette.length];

  const isStaleItem = (a) => {
    const lastSeen = a.behavior_data?.last_activity || a.start_time;
    return !lastSeen || (Date.now() - new Date(lastSeen).getTime()) / 60000 >= 30;
  };

  const renderLiveCard = (activity, staleFlag) => {
    const elapsedSec = Math.floor((nowTick - new Date(activity.start_time).getTime()) / 1000);
    const b = activity.behavior_data || {};
    // Support both field name conventions
    const totalTyped = b.chars_typed || b.total_typed_chars || 0;
    const totalPasted = b.pasted_chars || b.total_pasted_chars || 0;
    const pasteRatio = (totalTyped + totalPasted) > 0 ? Math.round((totalPasted / (totalTyped + totalPasted)) * 100) : 0;
    const tabCount = b.tab_switches || b.tab_switch_count || 0;
    const wpm = b.wpm || 0;
    const hasFlags = pasteRatio > 50 || tabCount > 10 || wpm > 120;
    const av = getAvatar(activity.user_name);
    const lastSeenStr = b.last_activity ? timeSinceStr(b.last_activity) : 'N/A';
    return (
      <div key={activity.id} className={`p-4 rounded-2xl border-2 ${staleFlag ? 'border-gray-200 bg-gray-50 opacity-70' : hasFlags ? 'border-yellow-300 bg-yellow-50' : 'border-green-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{getInitials(activity.user_name)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm truncate">{activity.user_name}</p>
              {staleFlag ? <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">Inactive</span>
                : <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium animate-pulse">● Live</span>}
              {hasFlags && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 font-medium">⚠ Flagged</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{activity.task_name} • {staleFlag ? `Last seen ${lastSeenStr}` : `Active ${fmtDur(elapsedSec)}`}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setViewingLiveActivity(activity)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-50"><Eye className="w-3.5 h-3.5" /> View</button>
            <button onClick={() => setDeleteConfirm({ item: activity, type: 'live' })} className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {[{ icon: '⌨️', label: 'Typed', value: totalTyped }, { icon: '📋', label: 'Pasted', value: totalPasted }, { icon: '🔄', label: 'Tabs', value: tabCount, alert: tabCount > 10 }, { icon: '⚡', label: 'WPM', value: wpm, alert: wpm > 120 }, { icon: '💾', label: 'Saved', value: `${b.saved_count || b.items_saved || b.entries_completed || 0}/${b.total || b.total_items || 0}` }].map(({ icon, label, value, alert }) => (
            <div key={label} className={`text-center p-2 rounded-xl ${alert ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
              <p className="text-sm">{icon}</p>
              <p className={`text-sm font-bold ${alert ? 'text-red-700' : 'text-gray-800'}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const filtered = liveActivities.filter(a => !activitySearch || a.user_name?.toString()?.toLowerCase()?.includes(activitySearch.toLowerCase()));
  const active = filtered.filter(a => !isStaleItem(a));
  const stale = filtered.filter(a => isStaleItem(a));
  const filteredHistory = activityHistory.filter(a => !activitySearch || a.user_name?.toString()?.toLowerCase()?.includes(activitySearch.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center justify-between">
          <div><p className="text-white font-bold text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Live Activity — My Users</p><p className="text-slate-400 text-xs mt-0.5">Real-time tracking • Auto-refreshes every 3s</p></div>
          <span className="text-slate-400 text-xs">{lastActivityRefresh.toLocaleTimeString()}</span>
        </div>
        <div className="bg-white px-5 py-3 border-t border-gray-100">
          <input placeholder="Search by user name..." value={activitySearch} onChange={e => setActivitySearch(e.target.value)} className="w-full max-w-sm px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Now', value: liveActivities.filter(a => { const ls = a.behavior_data?.last_activity || a.start_time; return ls && (Date.now() - new Date(ls).getTime()) / 60000 < 30; }).length, bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: true },
          { label: 'Completed Today', value: activityHistory.filter(a => a.status === 'COMPLETED' && new Date(a.end_time).toDateString() === new Date().toDateString()).length, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
          { label: 'Abandoned Today', value: activityHistory.filter(a => a.status === 'ABANDONED' && new Date(a.end_time).toDateString() === new Date().toDateString()).length, bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
          { label: 'Total History', value: activityHistory.length, bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
        ].map(({ label, value, bg, text, dot }) => (
          <div key={label} className={`rounded-2xl border-2 p-4 text-center ${bg}`}>
            <div className="flex items-center justify-center gap-1.5">
              {dot && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              <p className={`text-3xl font-black ${text}`}>{value}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-green-300 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-white" />
          <p className="text-white font-bold text-sm">Currently Working</p>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{active.length} active</span>
        </div>
        <div className="bg-white p-3 space-y-3">
          {filtered.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">No users found</p> : (
            <>
              {active.map(a => renderLiveCard(a, false))}
              {stale.length > 0 && (<>
                <div className="flex items-center gap-2 pt-1"><div className="flex-1 h-px bg-gray-200" /><p className="text-xs text-gray-400 font-medium">Inactive / Stale Sessions</p><div className="flex-1 h-px bg-gray-200" /></div>
                {stale.map(a => renderLiveCard(a, true))}
              </>)}
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-indigo-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-white" />
          <p className="text-white font-bold text-sm">Completed Tasks History</p>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{filteredHistory.length} records</span>
        </div>
        <div className="bg-white p-3 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10"><Activity className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p className="text-gray-400 text-sm">No history found</p></div>
          ) : filteredHistory.map(history => {
            const b = history.behavior_data || {};
            // Support both field name conventions
            const totalTyped = b.chars_typed || b.total_typed_chars || 0;
            const totalPasted = b.pasted_chars || b.total_pasted_chars || 0;
            const pasteRatio = (totalTyped + totalPasted) > 0 ? Math.round((totalPasted / (totalTyped + totalPasted)) * 100) : 0;
            const tabCount = b.tab_switches || b.tab_switch_count || 0;
            const wpm = b.wpm || 0;
            const hasFlags = pasteRatio > 50 || tabCount > 10 || wpm > 120;
            const isCompleted = history.status === 'COMPLETED';
            const av = getAvatar(history.user_name);
            return (
              <div key={history.id} className={`p-4 rounded-2xl border-2 ${hasFlags ? 'border-yellow-300 bg-yellow-50' : isCompleted ? 'border-green-200 bg-white' : 'border-red-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{getInitials(history.user_name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm truncate">{history.user_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{history.status}</span>
                      {hasFlags && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 font-medium">⚠ Flagged</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{history.task_name} • Duration: {fmtDur(history.total_duration)} • {timeSinceStr(history.end_time)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setViewingHistoryActivity(history)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-50"><Eye className="w-3.5 h-3.5" /> View</button>
                    <button onClick={() => setDeleteConfirm({ item: history, type: 'history' })} className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {[{ icon: '⌨️', label: 'Typed', value: totalTyped }, { icon: '📋', label: 'Pasted', value: totalPasted }, { icon: '🔄', label: 'Tabs', value: tabCount, alert: tabCount > 10 }, { icon: '⚡', label: 'WPM', value: wpm, alert: wpm > 120 }, { icon: '💾', label: 'Saved', value: `${b.saved_count || b.items_saved || b.entries_completed || 0}/${b.total || b.total_items || 0}` }].map(({ icon, label, value, alert }) => (
                    <div key={label} className={`text-center p-2 rounded-xl ${alert ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
                      <p className="text-sm">{icon}</p>
                      <p className={`text-sm font-bold ${alert ? 'text-red-700' : 'text-gray-800'}`}>{value}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewingLiveActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              {(() => { const av = avatarPalette[(viewingLiveActivity.user_name||'').charCodeAt(0)%6]; return <div style={{width:40,height:40,borderRadius:'50%',background:av.bg,color:av.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>{getInitials(viewingLiveActivity.user_name)}</div>; })()}
              <div className="flex-1"><p className="font-bold text-gray-900">{viewingLiveActivity.user_name}</p><p className="text-xs text-gray-500">Live Activity Details</p></div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium animate-pulse">● Live</span>
              <button onClick={() => setViewingLiveActivity(null)} className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[{ label: 'Task', value: viewingLiveActivity.task_name || 'N/A', bg: 'bg-gray-50' }, { label: 'Active Time', value: fmtDur(Math.floor((nowTick - new Date(viewingLiveActivity.start_time).getTime()) / 1000)), bg: 'bg-blue-50' }, { label: 'Last Seen', value: viewingLiveActivity.behavior_data?.last_activity ? timeSinceStr(viewingLiveActivity.behavior_data.last_activity) : 'N/A', bg: 'bg-purple-50' }].map(({ label, value, bg }) => (
                  <div key={label} className={`p-3 rounded-xl border text-center ${bg}`}><p className="text-xs text-gray-500 mb-1">{label}</p><p className="text-xs font-semibold text-gray-800 truncate">{value}</p></div>
                ))}
              </div>
              {(() => {
                const b = viewingLiveActivity.behavior_data || {};
                const t = b.chars_typed || b.total_typed_chars || 0, p = b.pasted_chars || b.total_pasted_chars || 0, pr = (t+p)>0?Math.round((p/(t+p))*100):0;
                const flags = [];
                const tabSwitches = b.tab_switches || b.tab_switch_count || 0;
                const pasteEvents = b.paste_attempts || b.paste_event_count || 0;
                if (tabSwitches>10) flags.push({level:'high',msg:`Excessive tab switching (${tabSwitches})`});
                else if (tabSwitches>5) flags.push({level:'med',msg:`Frequent tab switching (${tabSwitches})`});
                if (pr>50&&p>50) flags.push({level:'high',msg:`High paste ratio: ${pr}%`});
                if (pasteEvents>5) flags.push({level:'med',msg:`Multiple paste events: ${pasteEvents}`});
                if ((b.wpm||0)>120) flags.push({level:'high',msg:`Unrealistic typing speed: ${b.wpm} WPM`});
                if ((b.backspaces||b.backspace_count||0)===0&&t>200) flags.push({level:'med',msg:'No backspace usage — possible copy-paste'});
                if ((b.screen_hidden_events||0)>5) flags.push({level:'high',msg:`Screen hidden events: ${b.screen_hidden_events}`});
                if (flags.length===0) return null;
                return (<div className="p-3 rounded-xl border-2 border-red-200 bg-red-50"><p className="text-xs font-bold text-red-800 flex items-center gap-1 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Suspicious Activity</p>{flags.map((f,i)=><p key={i} className={`text-xs ${f.level==='high'?'text-red-700':'text-orange-600'}`}>{f.level==='high'?'🚨':'⚠️'} {f.msg}</p>)}</div>);
              })()}
              {(() => {
                const b = viewingLiveActivity.behavior_data || {};
                const totalTyped = b.chars_typed||b.total_typed_chars||0, totalPasted = b.pasted_chars||b.total_pasted_chars||0;
                const typingRatio = (totalTyped+totalPasted)>0?Math.round((totalTyped/(totalTyped+totalPasted))*100):null;
                return (<div className="p-4 rounded-xl border bg-cyan-50"><p className="text-xs font-bold text-cyan-800 mb-3">Typing Analysis</p><div className="grid grid-cols-3 gap-3 mb-3">{[{label:'Typed',value:totalTyped},{label:'Pasted',value:totalPasted},{label:'WPM',value:b.wpm||0}].map(({label,value})=>(<div key={label} className="text-center"><p className="text-xl font-black text-cyan-700">{value}</p><p className="text-xs text-gray-500">{label}</p></div>))}</div>{typingRatio!==null&&(<div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Typed {typingRatio}%</span><span>Pasted {100-typingRatio}%</span></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${typingRatio<50?'bg-red-500':typingRatio<70?'bg-yellow-400':'bg-green-500'}`} style={{width:`${typingRatio}%`}}/></div></div>)}</div>);
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border bg-indigo-50">
                  <p className="text-xs font-bold text-indigo-800 mb-3">Tab & Focus</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Tab Switches', value: (viewingLiveActivity.behavior_data?.tab_switches || viewingLiveActivity.behavior_data?.tab_switch_count || 0) },
                      { label: 'Paste Events', value: (viewingLiveActivity.behavior_data?.paste_attempts || viewingLiveActivity.behavior_data?.paste_event_count || 0) },
                      { label: 'Backspaces', value: (viewingLiveActivity.behavior_data?.backspaces || viewingLiveActivity.behavior_data?.backspace_count || 0) },
                      { label: 'Idle Time', value: viewingLiveActivity.behavior_data?.idle_time_seconds ? Math.floor(viewingLiveActivity.behavior_data.idle_time_seconds / 60) + 'm' : '0m' },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center"><p className="text-lg font-black text-indigo-700">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-gray-50">
                  <p className="text-xs font-bold text-gray-700 mb-3">Screen Behavior</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Min Count', value: (viewingLiveActivity.behavior_data?.window_minimized_count || 0) },
                      { label: 'Min Duration', value: (viewingLiveActivity.behavior_data?.window_minimized_seconds || 0) + 's' },
                      { label: 'Hidden Events', value: (viewingLiveActivity.behavior_data?.screen_hidden_events || 0) },
                      { label: 'Last Paste Len', value: (viewingLiveActivity.behavior_data?.paste_event_last_length || 0) },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center"><p className="text-lg font-black text-gray-700">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-gray-50 text-xs text-gray-500"><p>Session: <span className="font-mono text-gray-700">{viewingLiveActivity.session_id}</span></p><p>Started: {viewingLiveActivity.start_time ? new Date(viewingLiveActivity.start_time).toLocaleString() : 'N/A'}</p></div>
            </div>
          </div>
        </div>
      )}

      {viewingHistoryActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              {(() => { const av = avatarPalette[(viewingHistoryActivity.user_name||'').charCodeAt(0)%6]; return <div style={{width:40,height:40,borderRadius:'50%',background:av.bg,color:av.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>{getInitials(viewingHistoryActivity.user_name)}</div>; })()}
              <div className="flex-1"><p className="font-bold text-gray-900">{viewingHistoryActivity.user_name}</p><p className="text-xs text-gray-500">Completed Task Details</p></div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${viewingHistoryActivity.status==='COMPLETED'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{viewingHistoryActivity.status}</span>
              <button onClick={() => setViewingHistoryActivity(null)} className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[{ label:'Task', value: viewingHistoryActivity.task_name||'N/A', bg:'bg-gray-50' }, { label:'Start', value: viewingHistoryActivity.start_time?new Date(viewingHistoryActivity.start_time).toLocaleTimeString():'N/A', bg:'bg-blue-50' }, { label:'End', value: viewingHistoryActivity.end_time?new Date(viewingHistoryActivity.end_time).toLocaleTimeString():'N/A', bg:'bg-purple-50' }, { label:'Duration', value: fmtDur(viewingHistoryActivity.total_duration), bg:'bg-green-50' }].map(({label,value,bg})=>(<div key={label} className={`p-3 rounded-xl border text-center ${bg}`}><p className="text-xs text-gray-500 mb-1">{label}</p><p className="text-xs font-semibold text-gray-800 truncate">{value}</p></div>))}
              </div>
              {(() => {
                const b = viewingHistoryActivity.behavior_data || {};
                const totalTyped = b.chars_typed||b.total_typed_chars||0, totalPasted = b.pasted_chars||b.total_pasted_chars||0;
                const pasteRatio = (totalTyped+totalPasted)>0?Math.round((totalPasted/(totalTyped+totalPasted))*100):0;
                const tabCount = b.tab_switches||b.tab_switch_count||0;
                const flags = [];
                if (tabCount>10) flags.push({level:'high',msg:`Excessive tab switching (${tabCount})`});
                if (pasteRatio>50&&totalPasted>50) flags.push({level:'high',msg:`High paste ratio: ${pasteRatio}%`});
                if ((b.wpm||0)>120) flags.push({level:'high',msg:`Unrealistic typing speed: ${b.wpm} WPM`});
                if ((b.backspaces||b.backspace_count||0)===0&&totalTyped>200) flags.push({level:'med',msg:'No backspace usage — possible copy-paste'});
                if (flags.length===0) return null;
                return (<div className="p-3 rounded-xl border-2 border-red-200 bg-red-50"><p className="text-xs font-bold text-red-800 flex items-center gap-1 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Suspicious Activity</p>{flags.map((f,i)=><p key={i} className={`text-xs ${f.level==='high'?'text-red-700':'text-orange-600'}`}>{f.level==='high'?'🚨':'⚠️'} {f.msg}</p>)}</div>);
              })()}
              {(() => {
                const b = viewingHistoryActivity.behavior_data || {};
                const totalTyped = b.chars_typed||b.total_typed_chars||0, totalPasted = b.pasted_chars||b.total_pasted_chars||0;
                const typingRatio = (totalTyped+totalPasted)>0?Math.round((totalTyped/(totalTyped+totalPasted))*100):null;
                return (<div className="p-4 rounded-xl border bg-cyan-50"><p className="text-xs font-bold text-cyan-800 mb-3">Typing Analysis</p><div className="grid grid-cols-3 gap-3 mb-3">{[{label:'Typed',value:totalTyped},{label:'Pasted',value:totalPasted},{label:'WPM',value:b.wpm||0}].map(({label,value})=>(<div key={label} className="text-center"><p className="text-xl font-black text-cyan-700">{value}</p><p className="text-xs text-gray-500">{label}</p></div>))}</div>{typingRatio!==null&&(<div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Typed {typingRatio}%</span><span>Pasted {100-typingRatio}%</span></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${typingRatio<50?'bg-red-500':typingRatio<70?'bg-yellow-400':'bg-green-500'}`} style={{width:`${typingRatio}%`}}/></div></div>)}</div>);
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border bg-indigo-50">
                  <p className="text-xs font-bold text-indigo-800 mb-3">Tab & Focus</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Tab Switches', value: (viewingHistoryActivity.behavior_data?.tab_switches || viewingHistoryActivity.behavior_data?.tab_switch_count || 0) },
                      { label: 'Paste Events', value: (viewingHistoryActivity.behavior_data?.paste_attempts || viewingHistoryActivity.behavior_data?.paste_event_count || 0) },
                      { label: 'Backspaces', value: (viewingHistoryActivity.behavior_data?.backspaces || viewingHistoryActivity.behavior_data?.backspace_count || 0) },
                      { label: 'Idle Time', value: viewingHistoryActivity.behavior_data?.idle_time_seconds ? Math.floor(viewingHistoryActivity.behavior_data.idle_time_seconds / 60) + 'm' : '0m' },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center"><p className="text-lg font-black text-indigo-700">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-gray-50">
                  <p className="text-xs font-bold text-gray-700 mb-3">Screen & Items</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Min Duration', value: (viewingHistoryActivity.behavior_data?.window_minimized_seconds || 0) + 's' },
                      { label: 'Hidden Events', value: (viewingHistoryActivity.behavior_data?.screen_hidden_events || 0) },
                      { label: 'Active Time', value: fmtDur(viewingHistoryActivity.behavior_data?.active_seconds) },
                      { label: 'Items Saved', value: (viewingHistoryActivity.behavior_data?.items_saved || viewingHistoryActivity.behavior_data?.saved_count || 0) },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center"><p className="text-lg font-black text-gray-700">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-gray-50 text-xs text-gray-500"><p>Session: <span className="font-mono text-gray-700">{viewingHistoryActivity.session_id}</span></p></div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-3"><Trash2 className="w-5 h-5 text-red-600" /><p className="font-bold text-gray-900 text-base">Delete Activity</p></div>
            <p className="text-sm text-gray-600 mb-1">Are you sure you want to remove <span className="font-bold text-gray-900">{deleteConfirm.item?.user_name}</span>'s {deleteConfirm.type === 'live' ? 'live session' : 'history record'} from the tracker?</p>
            <p className="text-xs text-gray-400 mb-5">User account will not be affected.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={onDeleteConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
