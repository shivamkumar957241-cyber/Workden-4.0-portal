import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Search } from "lucide-react";

export default function HelpTicketsTab({ helpTickets }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("");

  const filtered = helpTickets.filter(ticket => {
    // Status filter
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      const idMatch = ticket.id?.toString()?.toLowerCase()?.includes(s);
      const nameMatch = ticket.user_name?.toString()?.toLowerCase()?.includes(s);
      const emailMatch = ticket.user_email?.toString()?.toLowerCase()?.includes(s);
      const subjectMatch = ticket.subject?.toString()?.toLowerCase()?.includes(s);
      if (!idMatch && !nameMatch && !emailMatch && !subjectMatch) return false;
    }

    // Date filter
    if (dateFilter === 'all') return true;
    const d = new Date(ticket.created_date);
    const now = new Date();
    if (dateFilter === 'today') {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      return d >= s;
    }
    if (dateFilter === 'yesterday') {
      const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
      const e = new Date(s); e.setHours(23, 59, 59, 999);
      return d >= s && d <= e;
    }
    if (dateFilter === 'last7days') {
      const s = new Date(now); s.setDate(s.getDate() - 7);
      return d >= s;
    }
    if (dateFilter === 'custom' && customRange.start && customRange.end) {
      const s = new Date(customRange.start);
      const e = new Date(customRange.end); e.setHours(23, 59, 59, 999);
      return d >= s && d <= e;
    }
    return true;
  });

  const openCount = helpTickets.filter(t => t.status === 'open').length;

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-6 h-6" />
            Help Tickets ({openCount} Open)
          </CardTitle>
          <Badge className="bg-white/20 text-white text-base px-3 py-1">{filtered.length} shown</Badge>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            placeholder="Search by Ticket ID, User Name, Email, Subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/20 border-white/30 text-white placeholder:text-white/60"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">🟡 Open</SelectItem>
              <SelectItem value="in_progress">🔵 In Progress</SelectItem>
              <SelectItem value="pending">🟠 Pending</SelectItem>
              <SelectItem value="resolved">✅ Resolved</SelectItem>
              <SelectItem value="closed">🔒 Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Time Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex gap-2 mt-2">
            <Input type="date" value={customRange.start} onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))} className="max-w-xs bg-white/20 border-white/30 text-white" />
            <Input type="date" value={customRange.end} onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))} className="max-w-xs bg-white/20 border-white/30 text-white" />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {filtered.length > 0 ? (
          filtered.map(ticket => (
            <Card key={ticket.id} className={`border-l-4 ${
              ticket.status === 'resolved' || ticket.status === 'closed'
                ? 'border-l-green-500 bg-green-50'
                : ticket.status === 'in_progress'
                ? 'border-l-blue-500 bg-blue-50'
                : ticket.status === 'pending'
                ? 'border-l-orange-500 bg-orange-50'
                : 'border-l-yellow-500 bg-yellow-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg">{ticket.subject}</p>
                      <span className="text-xs font-mono text-gray-400">#{ticket.id?.substring(0, 8)}</span>
                    </div>
                    <p className="text-sm text-gray-600">By: {ticket.user_name}</p>
                    {ticket.user_email && <p className="text-xs text-gray-500">{ticket.user_email}</p>}
                    <p className="text-xs text-gray-500">{new Date(ticket.created_date).toLocaleString()}</p>
                  </div>
                  <Badge className={
                    ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-green-600' :
                    ticket.status === 'in_progress' ? 'bg-blue-600' :
                    ticket.status === 'pending' ? 'bg-orange-500' : 'bg-yellow-600'
                  }>{ticket.status}</Badge>
                </div>
                <p className="text-gray-700 mb-3">{ticket.description}</p>
                {ticket.image_url && (
                  <a href={ticket.image_url} target="_blank" className="text-blue-600 text-sm">View Image</a>
                )}
                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button size="sm" onClick={async () => {
                      const reply = prompt("Enter admin reply:");
                      if (reply) {
                        await base44.entities.HelpTicket.update(ticket.id, { admin_reply: reply, status: 'resolved' });
                        queryClient.invalidateQueries({ queryKey: ['help-tickets'] });
                        alert('✅ Ticket resolved!');
                      }
                    }}>Resolve</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await base44.entities.HelpTicket.update(ticket.id, { status: 'in_progress' });
                      queryClient.invalidateQueries({ queryKey: ['help-tickets'] });
                    }}>Mark In Progress</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await base44.entities.HelpTicket.update(ticket.id, { status: 'closed' });
                      queryClient.invalidateQueries({ queryKey: ['help-tickets'] });
                    }}>Close</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await base44.entities.HelpTicket.update(ticket.id, { status: 'pending' });
                      queryClient.invalidateQueries({ queryKey: ['help-tickets'] });
                    }}>Mark Pending</Button>
                  </div>
                )}
                {ticket.admin_reply && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-semibold text-blue-800">Admin Reply:</p>
                    <p className="text-sm text-blue-700">{ticket.admin_reply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500 py-12">No tickets found</p>
        )}
      </CardContent>
    </Card>
  );
}
