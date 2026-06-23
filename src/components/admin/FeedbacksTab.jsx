import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search } from "lucide-react";

export default function FeedbacksTab({ userFeedbacks }) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("");

  const filtered = userFeedbacks.filter(fb => {
    if (categoryFilter !== 'all' && fb.experience !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!fb.user_name?.toString()?.toLowerCase()?.includes(s) && !fb.issues_faced?.toString()?.toLowerCase()?.includes(s) && !fb.suggestions?.toString()?.toLowerCase()?.includes(s)) return false;
    }
    if (dateFilter === 'all') return true;
    const d = new Date(fb.created_date);
    const now = new Date();
    if (dateFilter === 'today') { const s = new Date(now.setHours(0,0,0,0)); return d >= s; }
    if (dateFilter === 'yesterday') {
      const s = new Date(now); s.setDate(s.getDate()-1); s.setHours(0,0,0,0);
      const e = new Date(s); e.setHours(23,59,59,999);
      return d >= s && d <= e;
    }
    if (dateFilter === 'custom' && customRange.start && customRange.end) {
      const s = new Date(customRange.start), e = new Date(customRange.end); e.setHours(23,59,59,999);
      return d >= s && d <= e;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center gap-2"><Star className="w-6 h-6" />User Feedbacks</CardTitle>
          <Badge className="bg-white/20 text-white text-lg px-4 py-2">{userFeedbacks.length} Total</Badge>
        </div>
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input placeholder="Search by name, issues, suggestions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white/20 border-white/30 text-white placeholder:text-white/60" />
        </div>
        {/* Rating filter as dropdown */}
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="excellent">⭐ Excellent</SelectItem>
              <SelectItem value="good">👍 Good</SelectItem>
              <SelectItem value="average">😐 Average</SelectItem>
              <SelectItem value="poor">👎 Poor</SelectItem>
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
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {dateFilter === 'custom' && (
          <div className="flex gap-2 mt-2">
            <Input type="date" value={customRange.start} onChange={e => setCustomRange(p => ({...p, start: e.target.value}))} className="max-w-xs" />
            <Input type="date" value={customRange.end} onChange={e => setCustomRange(p => ({...p, end: e.target.value}))} className="max-w-xs" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {filtered.length > 0 ? filtered.map(fb => (
          <Card key={fb.id} className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{fb.user_name}</p>
                  <p className="text-xs text-gray-500">{new Date(fb.created_date).toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_,i) => (
                    <Star key={i} className={`w-4 h-4 ${i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <Badge className="mb-2">{fb.experience}</Badge>
              {fb.issues_faced && <div className="mt-2 p-2 bg-red-50 rounded"><p className="text-xs font-semibold text-red-800">Issues:</p><p className="text-sm text-red-700">{fb.issues_faced}</p></div>}
              {fb.suggestions && <div className="mt-2 p-2 bg-blue-50 rounded"><p className="text-xs font-semibold text-blue-800">Suggestions:</p><p className="text-sm text-blue-700">{fb.suggestions}</p></div>}
            </CardContent>
          </Card>
        )) : <p className="text-center text-gray-500 py-12">No feedbacks found</p>}
      </CardContent>
    </Card>
  );
}
