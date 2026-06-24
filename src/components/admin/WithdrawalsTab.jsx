import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

// IST datetime formatter
const formatIST = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export default function WithdrawalsTab({ withdrawals, users, appUsers, pendingWithdrawals, approveWithdrawalMutation, rejectWithdrawalMutation }) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });

  const applyFilters = (list) => {
    const now = new Date();
    return list.filter(w => {
      // Search
      const searchLower = search.toLowerCase();
      if (searchLower) {
        const user = users.find(u => u.id === w.user_id) || appUsers.find(u => u.id === w.user_id);
        const userName = user?.full_name || w.user_name || '';
        const userPhone = user?.phone || user?.mobile || '';
        if (!userName?.toString()?.toLowerCase()?.includes(searchLower) &&
            !userPhone.includes(searchLower) &&
            !String(w.amount).includes(searchLower)) return false;
      }

      // Date filter
      if (dateFilter === 'all') return true;
      const d = new Date(w.requested_date || w.created_date);
      if (dateFilter === 'last_hour') return d >= new Date(now.getTime() - 3600000);
      if (dateFilter === 'today') { const s = new Date(); s.setHours(0,0,0,0); return d >= s; }
      if (dateFilter === 'yesterday') {
        const s = new Date(now); s.setDate(s.getDate()-1); s.setHours(0,0,0,0);
        const e = new Date(s); e.setHours(23,59,59,999);
        return d >= s && d <= e;
      }
      if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
        return d >= new Date(customDateRange.start) && d <= new Date(customDateRange.end);
      }
      return true;
    });
  };

  const filteredWithdrawals = applyFilters(withdrawals);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawals ({pendingWithdrawals} pending)</CardTitle>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            ['all','All'],['last_hour','Last Hour'],['today','Today'],['yesterday','Yesterday'],['custom','Custom']
          ].map(([val, label]) => (
            <Button key={val} size="sm" variant={dateFilter === val ? 'default' : 'outline'}
              onClick={() => setDateFilter(val)}>
              {label}
            </Button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex gap-2 mt-2">
            <Input type="datetime-local" value={customDateRange.start}
              onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
              className="max-w-xs" placeholder="Start" />
            <Input type="datetime-local" value={customDateRange.end}
              onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
              className="max-w-xs" placeholder="End" />
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mt-3 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name, phone, amount..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method & Details</TableHead>
              <TableHead>Request Date (IST)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>UTR / Txn ID</TableHead>
              <TableHead>Approved Date (IST)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWithdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                  No withdrawal records found
                </TableCell>
              </TableRow>
            ) : (
              filteredWithdrawals.map(w => {
                const user = users.find(u => u.id === w.user_id) || 
                             appUsers.find(u => u.id === w.user_id);
                return (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user?.full_name || w.user_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{user?.email || w.user_email || '-'}</p>
                        <p className="text-xs text-gray-400">{user?.phone || user?.mobile || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-600 text-lg">₹{w.amount}</TableCell>
                    <TableCell className="text-xs">
                      {w.method === 'UPI' || w.upi_id ? (
                        <div className="space-y-0.5">
                          <p className="font-semibold flex items-center gap-1">📱 UPI</p>
                          <p className="text-gray-500">UPI ID:</p>
                          <p className="text-blue-600 font-medium">{w.upi_id}</p>
                          <a href="#" className="text-blue-500 underline text-[10px]">View QR</a>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="font-semibold flex items-center gap-1">🏦 Bank Transfer</p>
                          <p className="text-gray-600">{w.bank_name}</p>
                          <p className="text-gray-600">A/c: {w.account_number}</p>
                          <p className="text-gray-600">IFSC: {w.ifsc_code}</p>
                          <p className="text-gray-600">Holder: {w.account_holder}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-0.5">
                        <p>{formatIST(w.requested_date || w.created_date).split(',')[0]},</p>
                        <p>{formatIST(w.requested_date || w.created_date).split(',')[1]?.trim()}</p>
                        <p className="text-[10px] text-gray-400 mt-1">IST (GMT+5:30)</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={w.status === 'completed' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'} className={w.status === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                        {w.status === 'completed' ? '✅ Approved' : w.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {w.txn_id ? (
                        <p className="text-sm text-blue-700 font-bold">{w.txn_id}</p>
                      ) : <p className="text-gray-400">-</p>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-0.5 text-gray-500">
                        {w.approved_date ? (
                          <>
                            <p>{formatIST(w.approved_date).split(',')[0]},</p>
                            <p>{formatIST(w.approved_date).split(',')[1]?.trim()}</p>
                          </>
                        ) : <p>-</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {w.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => {
                            const txnId = prompt(`Enter Transaction ID for ₹${w.amount} approval:`);
                            if (txnId === null) return;
                            approveWithdrawalMutation.mutate({ withdrawalId: w.id, withdrawal: w, txnId: txnId.trim() });
                          }}>✓ Approve</Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => {
                            const reason = prompt("Reason:");
                            if (reason) rejectWithdrawalMutation.mutate({ id: w.id, reason, withdrawal: w });
                          }}>✗</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
