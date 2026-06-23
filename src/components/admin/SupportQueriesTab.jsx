import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Phone, Search, Filter } from "lucide-react";

export default function SupportQueriesTab({ helpTickets, callRequests, users = [], recruiters = [] }) {
  const queryClient = useQueryClient();
  const [helpSearch, setHelpSearch] = useState("");
  const [helpDateFilter, setHelpDateFilter] = useState("all");
  const [helpStatusFilter, setHelpStatusFilter] = useState("all");
  const [helpRecruiterFilter, setHelpRecruiterFilter] = useState("");
  const [callSearch, setCallSearch] = useState("");
  const [callDateFilter, setCallDateFilter] = useState("all");
  const [callStatusFilter, setCallStatusFilter] = useState("all");
  const [callRecruiterFilter, setCallRecruiterFilter] = useState("");

  // Get user-recruiter mapping
  const getUserRecruiter = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.assigned_recruiter_id || null;
  };

  // Filter help tickets
  const filteredHelpTickets = helpTickets.filter(ticket => {
    const searchLower = helpSearch.toLowerCase();
    const matchesSearch = !helpSearch || 
      ticket.user_name?.toString()?.toLowerCase()?.includes(searchLower) ||
      ticket.user_email?.toString()?.toLowerCase()?.includes(searchLower) ||
      ticket.user_phone?.toString()?.toLowerCase()?.includes(searchLower) ||
      ticket.subject?.toString()?.toLowerCase()?.includes(searchLower);
    
    if (!matchesSearch) return false;
    
    const ticketDate = new Date(ticket.created_date);
    const now = new Date();
    if (helpDateFilter === 'today') {
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      if (ticketDate < todayStart) return false;
    } else if (helpDateFilter === 'yesterday') {
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);
      if (ticketDate < yesterdayStart || ticketDate > yesterdayEnd) return false;
    } else if (helpDateFilter === 'last7days') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (ticketDate < sevenDaysAgo) return false;
    }
    
    if (helpStatusFilter !== 'all' && ticket.status !== helpStatusFilter) return false;
    
    if (helpRecruiterFilter) {
      const ticketRecruiterId = getUserRecruiter(ticket.user_id);
      if (String(ticketRecruiterId) !== String(helpRecruiterFilter)) return false;
    }
    
    return true;
  });

  // Filter call requests
  const filteredCallRequests = callRequests.filter(request => {
    const searchLower = callSearch.toLowerCase();
    const matchesSearch = !callSearch ||
      request.full_name?.toString()?.toLowerCase()?.includes(searchLower) ||
      request.mobile?.toString()?.toLowerCase()?.includes(searchLower) ||
      request.email?.toString()?.toLowerCase()?.includes(searchLower) ||
      request.subject?.toString()?.toLowerCase()?.includes(searchLower);
    
    if (!matchesSearch) return false;
    
    const requestDate = new Date(request.created_date);
    const now = new Date();
    if (callDateFilter === 'today') {
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      if (requestDate < todayStart) return false;
    } else if (callDateFilter === 'yesterday') {
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);
      if (requestDate < yesterdayStart || requestDate > yesterdayEnd) return false;
    } else if (callDateFilter === 'last7days') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (requestDate < sevenDaysAgo) return false;
    }
    
    if (callStatusFilter !== 'all' && request.status !== callStatusFilter) return false;
    
    if (callRecruiterFilter) {
      const requestRecruiterId = getUserRecruiter(request.user_id);
      if (String(requestRecruiterId) !== String(callRecruiterFilter)) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><MessageSquare className="w-6 h-6" />Support Queries</CardTitle>
            <Badge className="bg-white text-blue-600 text-lg px-3 py-1">{filteredHelpTickets.filter(t => t.status !== 'resolved').length} New</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by name, email, phone, or subject..." 
                value={helpSearch}
                onChange={(e) => setHelpSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Date</label>
                <Select value={helpDateFilter} onValueChange={setHelpDateFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Status</label>
                <Select value={helpStatusFilter} onValueChange={setHelpStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-600 mb-1 block">Recruiter</label>
                <Select value={helpRecruiterFilter} onValueChange={setHelpRecruiterFilter}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Recruiters" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Recruiters</SelectItem>
                    {recruiters.filter(r => r.status === 'active').map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {filteredHelpTickets.length > 0 ? (
            filteredHelpTickets.map(query => (
              <Card key={query.id} className="border-2 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-900">{query.subject}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-700"><strong>Name:</strong> {query.user_name || 'N/A'}</p>
                        <p className="text-gray-700"><strong>Email / User ID:</strong> {query.user_email || query.user_id || 'N/A'}</p>
                        <p className="text-gray-700"><strong>Phone:</strong> {query.user_phone || 'N/A'}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{new Date(query.created_date).toLocaleString()}</p>
                    </div>
                    <Badge className={query.status === 'resolved' ? 'bg-green-600' : query.status === 'in_progress' ? 'bg-blue-600' : 'bg-yellow-600'}>{query.status}</Badge>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200 mt-3">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Message:</p>
                    <p className="text-gray-700">{query.message || query.description || 'No message provided'}</p>
                  </div>
                  {query.status !== 'resolved' && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="bg-green-600" onClick={async () => {
                        const reply = prompt("Enter your reply:");
                        if (reply) { await base44.entities.HelpTicket.update(query.id, { admin_reply: reply, status: 'resolved' }); queryClient.invalidateQueries({ queryKey: ['help-tickets'] }); alert('✅ Resolved!'); }
                      }}>Resolve & Reply</Button>
                      <Button size="sm" variant="outline" onClick={async () => { await base44.entities.HelpTicket.update(query.id, { status: 'in_progress' }); queryClient.invalidateQueries({ queryKey: ['help-tickets'] }); }}>In Progress</Button>
                    </div>
                  )}
                  {query.admin_reply && <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg"><p className="text-sm font-semibold text-green-900">Admin Reply:</p><p className="text-sm text-green-800">{query.admin_reply}</p></div>}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12"><MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No support tickets yet</p></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardTitle className="flex items-center gap-2"><Phone className="w-6 h-6" />Call Requests ({filteredCallRequests.filter(c => c.status === 'pending').length} New)</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by name, mobile, email, or subject..." 
                value={callSearch}
                onChange={(e) => setCallSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Date</label>
                <Select value={callDateFilter} onValueChange={setCallDateFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Status</label>
                <Select value={callStatusFilter} onValueChange={setCallStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-600 mb-1 block">Recruiter</label>
                <Select value={callRecruiterFilter} onValueChange={setCallRecruiterFilter}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Recruiters" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Recruiters</SelectItem>
                    {recruiters.filter(r => r.status === 'active').map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filteredCallRequests.length > 0 ? filteredCallRequests.map(request => (
            <Card key={request.id} className={`border-2 ${request.status === 'resolved' ? 'border-green-300 bg-green-50' : request.status === 'contacted' ? 'border-blue-300 bg-blue-50' : 'border-yellow-300 bg-yellow-50'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">{request.full_name}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-gray-700"><strong>Mobile:</strong> {request.mobile}</p>
                      <p className="text-gray-700"><strong>Email:</strong> {request.email || 'N/A'}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{new Date(request.created_date).toLocaleString()}</p>
                  </div>
                  <Badge className={request.status === 'resolved' ? 'bg-green-600' : request.status === 'contacted' ? 'bg-blue-600' : 'bg-yellow-600'}>{request.status}</Badge>
                </div>
                <div className="p-3 bg-white rounded-lg border-2 border-gray-200 mb-2"><p className="text-sm font-semibold mb-1">Subject:</p><p>{request.subject}</p></div>
                <div className="p-3 bg-white rounded-lg border-2 border-gray-200"><p className="text-sm font-semibold mb-1">Issue:</p><p className="text-gray-700">{request.issue}</p></div>
                {request.status !== 'resolved' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="bg-blue-600" onClick={async () => { await base44.entities.CallRequest.update(request.id, { status: 'contacted' }); queryClient.invalidateQueries({ queryKey: ['call-requests'] }); alert('✅ Marked contacted!'); }}>Mark Contacted</Button>
                    <Button size="sm" className="bg-green-600" onClick={async () => { const notes = prompt("Admin notes (optional):"); await base44.entities.CallRequest.update(request.id, { status: 'resolved', admin_notes: notes || '' }); queryClient.invalidateQueries({ queryKey: ['call-requests'] }); alert('✅ Resolved!'); }}>Mark Resolved</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-12"><Phone className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No call requests yet</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
