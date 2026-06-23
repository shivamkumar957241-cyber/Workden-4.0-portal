import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Eye, Search, Calendar, Clock, Activity, AlertTriangle } from "lucide-react";

export default function ForceSubmitHistoryTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: records = [], refetch } = useQuery({
    queryKey: ['force-submit-history'],
    queryFn: () => base44.entities.ForceSubmitHistory.list('-submission_date'),
    refetchInterval: 30000
  });

  // Unique admins for filter
  const admins = [...new Set(records.map(r => r.admin_name).filter(Boolean))];

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      r.user_name?.toString()?.toLowerCase()?.includes(q) ||
      r.user_email?.toString()?.toLowerCase()?.includes(q) ||
      r.user_login_id?.toString()?.toLowerCase()?.includes(q) ||
      r.task_name?.toString()?.toLowerCase()?.includes(q) ||
      r.task_id?.toString()?.toLowerCase()?.includes(q);
    if (!matchSearch) return false;

    if (adminFilter !== "all" && r.admin_name !== adminFilter) return false;

    if (dateFilter !== "all") {
      const date = new Date(r.submission_date || r.created_date);
      const now = new Date();
      if (dateFilter === "today") {
        const s = new Date(now); s.setHours(0,0,0,0);
        return date >= s;
      }
      if (dateFilter === "yesterday") {
        const s = new Date(now); s.setDate(s.getDate()-1); s.setHours(0,0,0,0);
        const e = new Date(s); e.setHours(23,59,59,999);
        return date >= s && date <= e;
      }
      if (dateFilter === "last7days") {
        return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }
    return true;
  });

  const handleDelete = async (id) => {
    if (!confirm("Delete this force submit record?")) return;
    await base44.entities.ForceSubmitHistory.delete(id);
    queryClient.invalidateQueries({ queryKey: ['force-submit-history'] });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} records?`)) return;
    for (const id of selectedIds) {
      try { await base44.entities.ForceSubmitHistory.delete(id); } catch(e) {}
    }
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ['force-submit-history'] });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(r => r.id));
  };

  const formatDuration = (sec) => {
    if (!sec) return 'N/A';
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-6 h-6" />Force Submit History ({records.length})
            </CardTitle>
            {selectedIds.length > 0 && (
              <Button size="sm" variant="destructive" className="bg-red-800 hover:bg-red-900" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />Delete {selectedIds.length} Selected
              </Button>
            )}
          </div>
          <p className="text-sm text-orange-100 mt-1">All admin-initiated force submissions stored separately from normal submissions.</p>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search by name, email, task, ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Date Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Filter by Admin" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-orange-50 border-orange-200"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-orange-600">{records.length}</p><p className="text-xs text-gray-600">Total Force Submits</p></CardContent></Card>
            <Card className="bg-blue-50 border-blue-200"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-600">{filtered.length}</p><p className="text-xs text-gray-600">Showing</p></CardContent></Card>
            <Card className="bg-green-50 border-green-200"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{records.reduce((s, r) => s + (r.entries_count || 0), 0)}</p><p className="text-xs text-gray-600">Total Entries</p></CardContent></Card>
            <Card className="bg-purple-50 border-purple-200"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-purple-600">{admins.length}</p><p className="text-xs text-gray-600">Admins Involved</p></CardContent></Card>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-10"><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="cursor-pointer" /></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(record => {
                  const bd = record.behavior_data || {};
                  const hasPaste = (bd.paste_attempts || 0) > 0 || (bd.pasted_chars || 0) > 0;
                  return (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleSelect(record.id)} className="cursor-pointer" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{record.user_name}</p>
                          <p className="text-xs text-gray-500">{record.user_email || '—'}</p>
                          {record.user_login_id && <p className="text-xs font-mono text-blue-600">{record.user_login_id}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{record.task_name}</p>
                          {record.task_id && <p className="text-xs text-gray-400 font-mono">{record.task_id.substring(0,8)}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <div>
                            <p>{new Date(record.submission_date || record.created_date).toLocaleDateString()}</p>
                            <p>{new Date(record.submission_date || record.created_date).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{record.admin_name || 'Admin'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-bold text-green-600">{record.entries_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatDuration(record.duration_seconds)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <p className="text-gray-600">Chars: <span className="font-bold">{bd.chars_typed || 0}</span></p>
                          <p className="text-gray-600">WPM: <span className="font-bold">{bd.wpm || 0}</span></p>
                          {hasPaste && <Badge className="bg-red-100 text-red-700 text-xs px-1">⚠️ Paste</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedRecord(record); setDetailOpen(true); }}>
                            <Eye className="w-3 h-3 mr-1" />View
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7" onClick={() => handleDelete(record.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-semibold">No force submit records found</p>
                      <p className="text-xs mt-1">Records appear here when admin force-submits a user's task</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />Force Submit Detail
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {/* User & Task Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-bold text-blue-700 mb-1">User</p>
                  <p className="font-bold">{selectedRecord.user_name}</p>
                  <p className="text-xs text-gray-600">{selectedRecord.user_email}</p>
                  <p className="text-xs font-mono text-blue-600">{selectedRecord.user_login_id}</p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-bold text-green-700 mb-1">Task</p>
                  <p className="font-bold">{selectedRecord.task_name}</p>
                  <p className="text-xs text-gray-500">Entries: {selectedRecord.entries_count}</p>
                  <p className="text-xs text-gray-500">Duration: {formatDuration(selectedRecord.duration_seconds)}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="p-3 bg-gray-50 border rounded-lg grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Submitted:</span> <span className="font-semibold">{new Date(selectedRecord.submission_date || selectedRecord.created_date).toLocaleString()}</span></div>
                <div><span className="text-gray-500">Admin:</span> <span className="font-semibold">{selectedRecord.admin_name}</span></div>
                {selectedRecord.reason && <div className="col-span-2"><span className="text-gray-500">Reason:</span> <span className="font-semibold">{selectedRecord.reason}</span></div>}
                {selectedRecord.proof_id && <div className="col-span-2"><span className="text-gray-500">Proof ID:</span> <span className="font-mono text-xs">{selectedRecord.proof_id}</span></div>}
              </div>

              {/* Activity Metrics */}
              {(() => {
                const bd = selectedRecord.behavior_data || {};
                const metrics = [
                  { label: 'Chars Typed', value: bd.chars_typed || 0 },
                  { label: 'Words', value: bd.words || 0 },
                  { label: 'WPM', value: bd.wpm || 0 },
                  { label: 'Backspaces', value: bd.backspaces || 0 },
                  { label: 'Pasted Chars', value: bd.pasted_chars || 0, warn: true },
                  { label: 'Paste Attempts', value: bd.paste_attempts || 0, warn: true },
                  { label: 'Tab Switches', value: bd.tab_switches || 0, warn: bd.tab_switches > 3 },
                  { label: 'Active Time', value: bd.active_seconds ? `${Math.floor(bd.active_seconds/60)}m` : 'N/A' },
                ];
                return (
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-yellow-400 font-bold text-sm mb-3">⚡ Activity Metrics</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {metrics.map((m, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3">
                          <p className="text-gray-400 text-xs">{m.label}</p>
                          <p className={`text-lg font-black ${m.warn && m.value > 0 ? 'text-red-400' : 'text-white'}`}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Item Timings */}
              {selectedRecord.item_timings && selectedRecord.item_timings.length > 0 && (
                <div className="rounded-xl overflow-hidden border-2 border-orange-300">
                  <div className="px-4 py-2 bg-orange-500 flex items-center justify-between">
                    <p className="text-white font-bold text-sm">⏱ Item-wise Save Timing</p>
                    {(() => {
                      const sus = selectedRecord.item_timings.filter(t => t.suspicious).length;
                      return sus > 0 ? <Badge className="bg-red-600 text-white text-xs">⚠️ {sus} Suspicious</Badge> : null;
                    })()}
                  </div>
                  <div className="bg-orange-50 p-3">
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {selectedRecord.item_timings.map((t, i) => {
                        const mins = t.time_seconds !== null ? Math.floor(t.time_seconds / 60) : null;
                        const secs = t.time_seconds !== null ? t.time_seconds % 60 : null;
                        return (
                          <div key={i} className={`rounded-lg p-2 text-center border-2 ${t.suspicious ? 'bg-red-100 border-red-500' : 'bg-white border-gray-200'}`}>
                            <p className={`text-xs font-bold ${t.suspicious ? 'text-red-700' : 'text-gray-600'}`}>Item #{t.item}</p>
                            {t.time_seconds !== null ? (
                              <p className={`text-sm font-black ${t.suspicious ? 'text-red-600' : 'text-gray-800'}`}>{mins}m {secs}s</p>
                            ) : <p className="text-xs text-gray-400">N/A</p>}
                            {t.suspicious && <p className="text-xs text-red-500 font-semibold">⚠️ Fast</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* File Link */}
              {selectedRecord.file_url && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-bold text-green-800 mb-1">📥 Work File</p>
                  <a href={selectedRecord.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                    {selectedRecord.file_url}
                  </a>
                </div>
              )}

              {/* Submitted Entries */}
              {selectedRecord.task_data?.entries?.length > 0 && (
                <div>
                  <p className="font-bold text-sm mb-2">📝 Submitted Entries ({selectedRecord.entries_count} total, showing first {selectedRecord.task_data.entries.length})</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[...selectedRecord.task_data.entries].sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0)).map((item, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-purple-600 px-3 py-1.5">
                          <span className="text-white text-sm font-semibold">Entry #{item.id || idx+1}</span>
                        </div>
                        <div className="bg-white p-3 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {Object.entries(item).filter(([k]) => k !== 'id' && !k.startsWith('_')).map(([key, val]) => (
                            <div key={key} className="flex gap-2 text-xs border-b border-gray-100 pb-1">
                              <span className="text-gray-500 font-medium min-w-[100px] flex-shrink-0">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span>
                              <span className={`font-semibold ${!val ? 'text-red-400 italic' : 'text-gray-800'}`}>{val || 'Not filled'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
