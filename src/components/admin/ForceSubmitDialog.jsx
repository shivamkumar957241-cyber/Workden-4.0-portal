import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Search, Clock, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

export default function ForceSubmitDialog({ open, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingUser, setConfirmingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0, status: '' });
  const [forceReason, setForceReason] = useState("");

  const { data: activeTasks = [], refetch } = useQuery({
    queryKey: ['active-tasks-force-submit'],
    queryFn: async () => {
      const active = await base44.entities.ActiveTask.filter({ status: 'active' });
      const locked = await base44.entities.ActiveTask.filter({ status: 'locked' });
      return [...active, ...locked];
    },
    refetchInterval: submitting ? false : 10000,
    enabled: open
  });

  const { data: draftWorks = [] } = useQuery({
    queryKey: ['draft-works-force-submit'],
    queryFn: () => base44.entities.DraftWork.list('-saved_date'),
    refetchInterval: submitting ? false : 10000,
    enabled: open
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-force-submit'],
    queryFn: () => base44.entities.AppUser.list(),
    refetchInterval: submitting ? false : 15000,
    enabled: open
  });

  const { data: liveActivities = [] } = useQuery({
    queryKey: ['live-activities-force-submit'],
    queryFn: () => base44.entities.LiveActivity.list(),
    refetchInterval: submitting ? false : 10000,
    enabled: open
  });

  // Build list of users currently working
  const allActiveUserIds = new Set([
    ...activeTasks.map(t => t.user_id),
    ...liveActivities.map(a => a.user_id)
  ]);

  const usersWorking = Array.from(allActiveUserIds).map(userId => {
    const activeTask = activeTasks.find(t => t.user_id === userId);
    const liveActivity = liveActivities.find(a => a.user_id === userId);
    
    const task = activeTask || (liveActivity ? {
      user_id: userId,
      task_name: liveActivity.task_name || 'Unknown',
      task_id: liveActivity.id || '',
      start_time: liveActivity.start_time || new Date().toISOString(),
      status: 'active'
    } : null);
    
    if (!task) return null;
    
    const user = allUsers.find(u => u.id === userId);
    if (!user) return null;

    // STRICT task-name matching — only drafts for the CURRENT active task
    // Prevents data from other tasks leaking into this submission
    const currentTaskName = (task.task_name || '').trim().toLowerCase();
    const userDrafts = draftWorks.filter(d => {
      if (d.user_id !== userId) return false;
      const draftType = (d.work_type || '').trim().toLowerCase();
      // Exact match first
      if (draftType === currentTaskName) return true;
      // One contains the other (handles "Form Filling" vs "Form Filling Task 3")
      if (draftType.includes(currentTaskName) || currentTaskName.includes(draftType)) return true;
      return false;
    });

    return { task, user, liveActivity, draftCount: userDrafts.length, drafts: userDrafts };
  }).filter(Boolean);

  const filteredUsers = usersWorking.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.user.full_name?.toString()?.toLowerCase()?.includes(q) ||
      item.user.phone?.toString()?.toLowerCase()?.includes(q) ||
      item.user.login_user_id?.toString()?.toLowerCase()?.includes(q) ||
      item.user.email?.toString()?.toLowerCase()?.includes(q)
    );
  });

  // Retry helper
  const withRetry = async (fn, label, maxRetries = 6) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try { return await fn(); } catch (err) {
        if (attempt === maxRetries) throw err;
        const waitMs = Math.min(3000 * Math.pow(2, attempt - 1), 30000);
        setSubmitProgress(prev => ({ ...prev, status: `${label} — retrying in ${waitMs/1000}s (${attempt}/${maxRetries})...` }));
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  };

  const confirmForceSubmit = async () => {
    if (!confirmingUser) return;
    setSubmitting(true);
    setSubmitProgress({ current: 0, total: confirmingUser.drafts.length, status: 'Preparing drafts...' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const { task, user, drafts } = confirmingUser;

      if (!drafts || drafts.length === 0) {
        alert('⚠️ No drafts found for this user. Cannot force submit.');
        setConfirmingUser(null);
        setSubmitting(false);
        return;
      }

      // Group drafts by entry and reassemble chunks
      const entriesMap = new Map();
      drafts.forEach((draft, idx) => {
        setSubmitProgress({ current: idx + 1, total: drafts.length, status: 'Processing drafts...' });
        const taskData = typeof draft.task_data === 'string' ? JSON.parse(draft.task_data || '{}') : (draft.task_data || {});
        const entryId = taskData?.id || draft.id || idx;
        if (!entriesMap.has(entryId)) {
          entriesMap.set(entryId, { chunks: [], content: [], data: taskData });
        }
        const entry = entriesMap.get(entryId);
        entry.chunks.push(draft);
        entry.content.push(draft.task_content);
      });

      // Reassemble
      const reassembledEntries = [];
      entriesMap.forEach((entry, entryId) => {
        entry.chunks.sort((a, b) => {
          const aD = typeof a.task_data === 'string' ? JSON.parse(a.task_data || '{}') : (a.task_data || {});
          const bD = typeof b.task_data === 'string' ? JSON.parse(b.task_data || '{}') : (b.task_data || {});
          return (aD?._chunk_number || 0) - (bD?._chunk_number || 0);
        });
        reassembledEntries.push({
          entry_id: entryId,
          content: entry.content.join(''),
          data: entry.data,
          chunks_count: entry.chunks.length
        });
      });

      setSubmitProgress({ current: drafts.length, total: drafts.length, status: 'Cleaning entries...' });

      // Strip UI-only metadata from entries and SORT by item number (ascending)
      const cleanedEntries = reassembledEntries.map(e => {
        const d = { ...e.data };
        ['isSaved','savedAt','timeTakenSeconds','_chunk_number','_total_chunks','_is_chunk','_retried_from_backup'].forEach(k => delete d[k]);
        return { ...e, data: d };
      }).sort((a, b) => {
        const aNum = typeof a.entry_id === 'number' ? a.entry_id : parseInt(a.entry_id) || 0;
        const bNum = typeof b.entry_id === 'number' ? b.entry_id : parseInt(b.entry_id) || 0;
        return aNum - bNum;
      });

      // taskData sorted ascending by entry id
      const taskData = cleanedEntries.map(e => {
        const d = { ...e.data };
        // Ensure id field is present for display
        if (!d.id) d.id = e.entry_id;
        return d;
      });
      let content = `${task.task_name}\nForce Submitted by Admin\nEntries: ${cleanedEntries.length}\n\n`;
      cleanedEntries.forEach(e => { content += `--- Entry #${e.entry_id} ---\n${e.content}\n\n`; });

      const taskStartMs = new Date(task.start_time).getTime();
      const taskEndMs = Date.now();
      const elapsedSec = Math.floor((taskEndMs - taskStartMs) / 1000);

      // Reward
      let rewardAmount = 100;
      try {
        const tasks = await withRetry(() => base44.entities.Task.list(), 'Fetching tasks');
        const match = tasks.find(t => t.name === task.task_name);
        if (match?.reward) rewardAmount = match.reward;
      } catch(e) {}

      await new Promise(r => setTimeout(r, 1000));

      // Upload file
      let uploadedFileUrl = null;
      try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const file = new File([blob], `ForceSubmit_${Date.now()}.txt`, { type: 'text/plain' });
        const res = await withRetry(() => base44.integrations.Core.UploadFile({ file }), 'Uploading file');
        uploadedFileUrl = res?.file_url || null;
      } catch(e) {}

      setSubmitProgress({ current: drafts.length + 1, total: drafts.length + 5, status: 'Fetching activity metrics...' });

      // Get live activity metrics — use DB values pushed by LiveActivityBar
      let liveMetrics = {};
      let itemTimings = [];
      try {
        await new Promise(r => setTimeout(r, 1000));
        const byUser = await withRetry(
          () => base44.entities.LiveActivity.filter({ user_id: user.id }),
          'Fetching activity'
        ).catch(() => []);

        let userLiveActivity = null;
        if (byUser?.length > 0) {
          // Pick the record matching the current task (by task_name)
          userLiveActivity = byUser.find(a => 
            (a.task_name || '').toLowerCase() === (task.task_name || '').toLowerCase()
          ) || byUser.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))[0];
        }

        // Item timings from draft saved_date timestamps
        const sortedDrafts = [...drafts].sort((a, b) =>
          new Date(a.saved_date || a.created_date || 0) - new Date(b.saved_date || b.created_date || 0)
        );
        const seenEntryIds = new Set();
        const dedupedDrafts = sortedDrafts.filter(d => {
          const dD = typeof d.task_data === 'string' ? JSON.parse(d.task_data || '{}') : (d.task_data || {});
          const eid = dD?.id ?? d.id;
          if (seenEntryIds.has(eid)) return false;
          seenEntryIds.add(eid);
          return true;
        });
        let prevSaveMs = taskStartMs;
        itemTimings = dedupedDrafts.map((draft, idx) => {
          const dD = typeof draft.task_data === 'string' ? JSON.parse(draft.task_data || '{}') : (draft.task_data || {});
          const entryId = dD?.id || (idx + 1);
          const savedMs = draft.saved_date ? new Date(draft.saved_date).getTime()
                        : draft.created_date ? new Date(draft.created_date).getTime() : null;
          const timeTaken = savedMs ? Math.floor((savedMs - prevSaveMs) / 1000) : null;
          if (savedMs) prevSaveMs = savedMs;
          return { item: entryId, time_seconds: timeTaken, suspicious: timeTaken !== null && timeTaken < 180 };
        });

        // Use DB values directly (pushed by LiveActivityBar via pushLiveBarMetrics)
        const bd = userLiveActivity?.behavior_data || {};
        liveMetrics = {
          chars_typed:              bd.total_typed_chars         || 0,
          words:                    bd.total_typed_chars > 0 ? Math.floor(bd.total_typed_chars / 5) : 0,
          wpm:                      bd.wpm                       || 0,
          pasted_chars:             bd.total_pasted_chars        || 0,
          paste_attempts:           bd.paste_event_count         || 0,
          tab_switches:             bd.tab_switch_count          || 0,
          backspaces:               bd.backspace_count           || 0,
          saved_count:              cleanedEntries.length,
          items_saved:              cleanedEntries.length,
          total:                    task.task_name.includes('Data Entry') ? 35 : 30,
          item_timings:             itemTimings,
          suspicious_items:         itemTimings.filter(t => t.suspicious).length,
          active_seconds:           bd.active_seconds            || 0,
          idle_time_seconds:        bd.idle_time_seconds         || 0,
          window_minimized_seconds: bd.window_minimized_seconds  || 0,
          screen_hidden_events:     bd.screen_hidden_events      || 0,
          start_time:               userLiveActivity?.start_time || task.start_time,
          end_time:                 new Date(taskEndMs).toISOString(),
          total_working_time:       elapsedSec,
          force_submitted_by_admin: true,
          ...(userLiveActivity ? {} : { no_live_activity_found: true }),
        };
      } catch(e) {
        liveMetrics = {
          saved_count: cleanedEntries.length, items_saved: cleanedEntries.length,
          total: task.task_name.includes('Data Entry') ? 35 : 30,
          item_timings: [], start_time: task.start_time,
          end_time: new Date(taskEndMs).toISOString(),
          total_working_time: elapsedSec, force_submitted_by_admin: true,
        };
      }

      setSubmitProgress({ current: drafts.length + 2, total: drafts.length + 5, status: 'Creating proof record...' });
      await new Promise(r => setTimeout(r, 1500));

      // Get admin name
      let adminName = 'Admin';
      try {
        const savedUser = localStorage.getItem('workden_user');
        if (savedUser) { const u = JSON.parse(savedUser); adminName = u.full_name || u.email || 'Admin'; }
      } catch(e) {}

      // Create Proof
      const proof = await withRetry(() => base44.entities.Proof.create({
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_id_number: user.login_user_id || user.id,
        task_id: task.task_id || '',
        task_name: task.task_name,
        work_type: task.task_name,
        task_content: `Force submitted by admin (${adminName}). ${cleanedEntries.length} entries. Reason: ${forceReason || 'N/A'}`,
        file_url: uploadedFileUrl,
        task_data: { entries: taskData.slice(0, 10), force_submitted: true, admin_submitted: true, entries_count: cleanedEntries.length },
        csv_data: '',
        status: 'pending',
        submitted_date: new Date().toISOString(),
        reward_amount: rewardAmount,
        duration_seconds: elapsedSec,
        auto_submitted: false,
        behavior_data: liveMetrics
      }), 'Creating proof');

      setSubmitProgress({ current: drafts.length + 3, total: drafts.length + 5, status: 'Saving force submit history...' });

      // Save to ForceSubmitHistory (separate from normal submissions)
      await withRetry(() => base44.entities.ForceSubmitHistory.create({
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_email: user.email || '',
        user_login_id: user.login_user_id || '',
        task_id: task.task_id || '',
        task_name: task.task_name,
        submission_date: new Date().toISOString(),
        admin_name: adminName,
        entries_count: cleanedEntries.length,
        duration_seconds: elapsedSec,
        behavior_data: liveMetrics,
        item_timings: itemTimings,
        proof_id: proof?.id || '',
        file_url: uploadedFileUrl,
        reason: forceReason || '',
        task_data: { entries: taskData.slice(0, 10) }
      }), 'Saving history').catch(() => {});

      setSubmitProgress({ current: drafts.length + 4, total: drafts.length + 5, status: 'Updating task & cleaning up...' });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update ActiveTask status
      let taskToUpdate = activeTasks.find(t => t.user_id === user.id && t.task_name === task.task_name)
                      || activeTasks.find(t => t.user_id === user.id);
      if (taskToUpdate?.id) {
        const newStatus = taskToUpdate.status === 'locked' ? 'locked' : 'submitted';
        await withRetry(() => base44.entities.ActiveTask.update(taskToUpdate.id, { status: newStatus }), 'Updating task').catch(() => {});
      }

      // Delete drafts
      for (let i = 0; i < drafts.length; i++) {
        try {
          await base44.entities.DraftWork.delete(drafts[i].id);
          if ((i + 1) % 3 === 0) await new Promise(r => setTimeout(r, 800));
        } catch(e) {}
      }

      // Notify user via Notification entity
      await withRetry(() => base44.entities.Notification.create({
        user_id: user.id,
        title: "✅ Task Force Submitted",
        message: `Your ${task.task_name} was force submitted by admin with ${cleanedEntries.length} entries. It's now under review.`,
        type: "success"
      }), 'Sending notification').catch(() => {});

      // Real-time signal: write a force_submitted_at timestamp on both collections since we don't know the exact source
      const tsUpdate = {
        force_submitted_at: new Date().toISOString(),
        force_submitted_task: task.task_name,
      };
      await base44.entities.AppUser.update(user.id, tsUpdate).catch(() => {});
      await base44.entities.User.update(user.id, tsUpdate).catch(() => {});

      setSubmitProgress({ current: drafts.length + 5, total: drafts.length + 5, status: 'Complete!' });
      setTimeout(() => {
        alert(`✅ Force submitted ${cleanedEntries.length} entries for ${user.full_name}`);
        setConfirmingUser(null);
        setForceReason("");
        onClose();
        refetch();
      }, 500);

    } catch (error) {
      console.error('Force submit failed:', error);
      alert('❌ Failed to force submit: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitProgress({ current: 0, total: 0, status: '' }), 2000);
    }
  };

  const formatDuration = (sec) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { onClose(); setSearchQuery(""); setConfirmingUser(null); } }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />Force Submit Tasks
            </DialogTitle>
            <DialogDescription>
              Force submit saved work for users who couldn't submit due to technical issues. Only data for the current active task is included.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search by user name, phone, or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-blue-50 border-blue-200"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p><p className="text-xs text-gray-600">Active Users</p></CardContent></Card>
              <Card className="bg-green-50 border-green-200"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{filteredUsers.reduce((s, i) => s + i.draftCount, 0)}</p><p className="text-xs text-gray-600">Total Drafts</p></CardContent></Card>
              <Card className="bg-purple-50 border-purple-200"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-purple-600">{filteredUsers.filter(i => i.draftCount > 0).length}</p><p className="text-xs text-gray-600">With Saved Work</p></CardContent></Card>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Saved Drafts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((item, index) => {
                    const startTime = new Date(item.task.start_time);
                    const elapsedSec = Math.floor((Date.now() - startTime.getTime()) / 1000);
                    const hasDrafts = item.draftCount > 0;
                    return (
                      <TableRow key={index} className={hasDrafts ? 'bg-green-50' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{item.user.full_name}</p>
                            <p className="text-xs text-gray-500">{item.user.phone}</p>
                            {item.user.login_user_id && <p className="text-xs text-blue-600 font-mono">{item.user.login_user_id}</p>}
                            {item.user.email && <p className="text-xs text-gray-400">{item.user.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell><p className="text-sm font-medium">{item.task.task_name}</p></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            {startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell><p className="text-sm font-mono font-bold text-purple-600">{formatDuration(elapsedSec)}</p></TableCell>
                        <TableCell>
                          {hasDrafts ? (
                            <Badge className="bg-green-600"><FileText className="w-3 h-3 mr-1" />{item.draftCount} saved</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-400">No drafts</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" disabled={!hasDrafts} onClick={() => setConfirmingUser(item)} className={hasDrafts ? 'bg-orange-600 hover:bg-orange-700' : ''}>
                            Force Submit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No users currently working on tasks</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmingUser} onOpenChange={() => !submitting && setConfirmingUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />Confirm Force Submit
            </DialogTitle>
            <DialogDescription>This will submit the user's saved drafts on their behalf.</DialogDescription>
          </DialogHeader>

          {confirmingUser && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">User</p>
                <p className="text-sm text-blue-700">{confirmingUser.user.full_name}</p>
                <p className="text-xs text-blue-600">{confirmingUser.user.phone} • {confirmingUser.user.email || confirmingUser.user.login_user_id}</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-900">Task (Current Only)</p>
                <p className="text-sm text-green-700">{confirmingUser.task.task_name}</p>
                <p className="text-xs text-green-600">Only data for this task will be submitted. Other tasks excluded.</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-semibold text-purple-900">Drafts to Submit</p>
                <p className="text-2xl font-bold text-purple-700">{confirmingUser.draftCount}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Reason for Force Submit (Optional)</label>
                <input
                  type="text"
                  value={forceReason}
                  onChange={e => setForceReason(e.target.value)}
                  placeholder="e.g. User facing technical issue, deadline..."
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Warning</p>
                <p className="text-xs text-amber-700">This action cannot be undone. The task will be submitted for review and the user's drafts will be deleted. A record will be saved in Force Submit History.</p>
              </div>
            </div>
          )}

          {submitting && (
            <div className="space-y-2 px-1">
              <Progress value={submitProgress.total > 0 ? Math.round((submitProgress.current / submitProgress.total) * 100) : 0} className="h-2" />
              <p className="text-xs text-center text-gray-600 animate-pulse">{submitProgress.status || 'Processing...'}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingUser(null)} disabled={submitting}>Cancel</Button>
            <Button onClick={confirmForceSubmit} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
              {submitting ? 'Please wait...' : 'Confirm Force Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
