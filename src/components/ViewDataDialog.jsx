import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, IndianRupee } from "lucide-react";

function parseEntries(proof) {
  // 1. Try csv_data (primary — always populated from task pages)
  if (proof.csv_data) {
    try {
      const parsed = typeof proof.csv_data === 'string' ? JSON.parse(proof.csv_data) : proof.csv_data;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
  }
  // 2. Try task_data
  if (proof.task_data) {
    try {
      const d = typeof proof.task_data === 'string' ? JSON.parse(proof.task_data) : proof.task_data;
      const items = d.entries || d.forms || d.corrections || d.pages || (Array.isArray(d) ? d : null);
      if (items && items.length > 0) return items;
    } catch(e) {}
  }
  // 3. Parse task_content plain text: "--- Entry #1 ---\nKey: Value\n..."
  if (proof.task_content) {
    const blocks = proof.task_content.split(/---\s*(?:Entry|Form|Item|Page)\s*#\d+\s*---/i).slice(1);
    if (blocks.length > 0) {
      const items = blocks.map((block, idx) => {
        const obj = { id: idx + 1 };
        block.split('\n').forEach(line => {
          const ci = line.indexOf(':');
          if (ci > 0) {
            const k = line.slice(0, ci).trim();
            const v = line.slice(ci + 1).trim();
            if (k) obj[k] = (v === 'N/A' || v === '') ? '' : v;
          }
        });
        return Object.keys(obj).length > 1 ? obj : null;
      }).filter(Boolean);
      if (items.length > 0) return items;
    }
  }
  return null;
}

export default function ViewDataDialog({ proof, onClose }) {
  const entries = parseEntries(proof);
  const statusColor = proof.status === 'approved' ? 'bg-green-600' : proof.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-500';

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">📋 {proof.work_type}</DialogTitle>
        </DialogHeader>

        {/* Summary bar */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl text-sm border border-gray-200">
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Status</p>
            <span className={`text-white text-xs font-bold px-2 py-1 rounded-full ${statusColor}`}>
              {proof.status === 'approved' ? '✓ Approved' : proof.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Reward</p>
            <p className="font-bold text-green-600">₹{proof.reward_amount || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Work Time</p>
            <p className="font-semibold text-gray-700">
              {proof.duration_seconds
                ? `${Math.floor(proof.duration_seconds / 60)}m ${Math.round(proof.duration_seconds % 60)}s`
                : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Submitted</p>
            <p className="font-semibold text-gray-700 text-xs">{new Date(proof.submitted_date || proof.created_date).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Submitted Date */}
        <p className="text-xs text-gray-400 -mt-1">
          Submitted: {new Date(proof.submitted_date || proof.created_date).toLocaleString('en-IN')}
        </p>

        {/* Activity Metrics */}
        {(() => {
          let bd = proof.behavior_data;
          if (typeof bd === 'string') { try { bd = JSON.parse(bd); } catch(e) { bd = null; } }
          const hasData = bd && Object.keys(bd).length > 0;
          if (hasData) {
            return (
              <div className="mt-2 bg-gray-900 rounded-xl p-3">
                <p className="text-yellow-400 font-bold text-xs mb-2">⚡ Live Activity Metrics</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Chars Typed', val: bd.chars_typed ?? 0 },
                    { label: 'Words', val: bd.words ?? 0 },
                    { label: 'WPM', val: bd.wpm ?? 0 },
                    { label: 'Saved', val: `${bd.saved_count ?? 0}/${bd.total ?? 0}` },
                    { label: 'Pasted Chars', val: bd.pasted_chars ?? 0, warn: bd.pasted_chars > 0 },
                    { label: 'Paste Attempts', val: bd.paste_attempts ?? 0, warn: bd.paste_attempts > 0 },
                    { label: 'Tab Switches', val: bd.tab_switches ?? 0, warn: bd.tab_switches > 3 },
                    { label: 'Backspaces', val: bd.backspaces ?? 0 },
                  ].map((m, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-gray-400 text-[10px] leading-tight">{m.label}</p>
                      <p className={`font-black text-xs ${m.warn ? 'text-red-400' : 'text-white'}`}>{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Rejection reason if any */}
        {proof.rejection_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 font-semibold text-xs mb-1">⚠️ Rejection Reason:</p>
            <p className="text-red-600 text-sm">{proof.rejection_reason}</p>
          </div>
        )}

        {/* Entries */}
        {entries && entries.length > 0 ? (
          <div>
            <p className="font-bold text-sm text-gray-700 mb-2">
              📝 Submitted Entries — <span className="text-indigo-600">{entries.length} item{entries.length > 1 ? 's' : ''}</span>
            </p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {entries.map((item, idx) => {
                const fields = Object.entries(item).filter(([k]) => k !== 'id');
                return (
                  <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Entry header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {item.id || idx + 1}
                      </span>
                      <span className="text-white font-semibold text-sm">Entry #{item.id || idx + 1}</span>
                    </div>
                    {/* Fields grid */}
                    <div className="bg-white p-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                      {fields.filter(([key]) => !key.startsWith('_')).map(([key, val]) => {
                        const isEmpty = !val && val !== 0;
                        // Format field name: convert camelCase to Title Case (e.g., fullName → Full Name, phoneNumber → Phone Number)
                        const formattedKey = key
                          .replace(/([A-Z])/g, ' $1')  // Insert space before capital letters
                          .replace(/^./, str => str.toUpperCase());  // Capitalize first letter
                        return (
                          <div key={key} className="flex gap-2 text-xs py-1 border-b border-gray-100 last:border-0">
                            <span className="text-gray-500 font-semibold min-w-[110px] flex-shrink-0">{formattedKey}:</span>
                            <span className={isEmpty ? 'text-red-400 italic' : 'text-gray-900 font-medium'}>
                              {isEmpty ? 'Not filled' : String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No entry data recorded for this submission.</p>
            {proof.task_content && (
              <div className="mt-3 text-left border rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs whitespace-pre-wrap text-gray-600">{proof.task_content}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
