import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function SettingsTab({ globalSettings, tasks, trainingVideos }) {
  const queryClient = useQueryClient();
  const [selectedTopic, setSelectedTopic] = useState("");
  const [platformOff, setPlatformOff] = useState(globalSettings.find(s => s.setting_key === 'platform_off_enabled')?.setting_value === 'true');
  const [offMessage, setOffMessage] = useState(globalSettings.find(s => s.setting_key === 'platform_off_message')?.setting_value || "");

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Payment QR & UPI */}
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"><CardTitle>💳 Payment QR & UPI</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-4">
          {globalSettings.find(s => s.setting_key === 'payment_qr') && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm mb-2">Current QR:</p>
              <img src={globalSettings.find(s => s.setting_key === 'payment_qr')?.setting_value} alt="QR" className="max-w-[150px] mx-auto rounded" />
            </div>
          )}
          {globalSettings.find(s => s.setting_key === 'payment_upi') && (
            <div className="p-3 bg-blue-50 rounded text-center"><p className="text-xs mb-1">UPI:</p><p className="font-mono font-bold">{globalSettings.find(s => s.setting_key === 'payment_upi')?.setting_value}</p></div>
          )}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Upload QR Image</Label>
            <input type="file" accept="image/*" id="qr-file-upload" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const { file_url } = await base44.integrations.Core.UploadFile({ file });
              const existing = globalSettings.find(s => s.setting_key === 'payment_qr');
              existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: file_url }) : await base44.entities.GlobalSettings.create({ setting_key: 'payment_qr', setting_value: file_url });
              queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ QR uploaded!');
            }} />
            <Button onClick={() => document.getElementById('qr-file-upload').click()} className="w-full bg-gradient-to-r from-green-500 to-emerald-600">📤 Upload QR Image</Button>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Enter QR URL</Label>
            <Input placeholder="Paste image URL" id="payment-qr-url" />
            <Button onClick={async () => {
              const url = document.getElementById('payment-qr-url').value; if (!url) return;
              let finalUrl = url;
              if (url.includes('drive.google.com')) { const match = url.match(/\/file\/d\/([^/]+)/)||url.match(/[?&]id=([^&]+)/); if (match) finalUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`; }
              const existing = globalSettings.find(s => s.setting_key === 'payment_qr');
              existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: finalUrl }) : await base44.entities.GlobalSettings.create({ setting_key: 'payment_qr', setting_value: finalUrl });
              queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ QR URL updated!');
            }} className="w-full mt-2 bg-green-500">Save QR URL</Button>
          </div>
          <div className="border-t pt-4">
            <Label className="text-sm font-semibold mb-2 block">💳 Payment Link (Razorpay / Any)</Label>
            {globalSettings.find(s => s.setting_key === 'payment_link') && (
              <div className="p-2 bg-green-50 rounded text-xs text-gray-600 mb-2 break-all">
                <strong>Current:</strong> {globalSettings.find(s => s.setting_key === 'payment_link')?.setting_value}
              </div>
            )}
            <Input placeholder="https://razorpay.me/@WorkDen" id="payment-link-id" defaultValue={globalSettings.find(s => s.setting_key === 'payment_link')?.setting_value || ""} />
            <Button onClick={async () => {
              const link = document.getElementById('payment-link-id').value; if (!link) return;
              const existing = globalSettings.find(s => s.setting_key === 'payment_link');
              existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: link }) : await base44.entities.GlobalSettings.create({ setting_key: 'payment_link', setting_value: link, description: 'Payment link shown on subscription page' });
              queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Payment Link updated!');
            }} className="w-full mt-2 bg-green-600">Save Payment Link</Button>
          </div>
          <div className="border-t pt-4">
            <Label className="text-sm font-semibold mb-2 block">UPI ID (for reference)</Label>
            <Input placeholder="Enter UPI ID" id="payment-upi-id" defaultValue={globalSettings.find(s => s.setting_key === 'payment_upi')?.setting_value || ""} />
            <Button onClick={async () => {
              const upi = document.getElementById('payment-upi-id').value; if (!upi) return;
              const existing = globalSettings.find(s => s.setting_key === 'payment_upi');
              existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: upi }) : await base44.entities.GlobalSettings.create({ setting_key: 'payment_upi', setting_value: upi });
              queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ UPI updated!');
            }} className="w-full mt-2 bg-blue-500">Save UPI ID</Button>
          </div>
        </CardContent>
      </Card>

      {/* Earning Proof Images */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle>🖼️ Earning Proof Images</CardTitle>
            <Button onClick={async () => {
              const imageTitle = prompt("Image title (e.g. Payment Proof - ₹5000):"); if (!imageTitle) return;
              const imageUrl = prompt("Image URL (Google Drive link or direct URL):"); if (!imageUrl) return;
              const imageDesc = prompt("Description (optional):") || "";
              const existing = globalSettings.filter(s => s.setting_key === 'earning_proof_images');
              let arr = [];
              if (existing.length > 0) { const d = existing[0].setting_value; arr = typeof d === 'string' ? JSON.parse(d) : d; if (!Array.isArray(arr)) arr = [arr]; }
              arr.push({ title: imageTitle, url: imageUrl, description: imageDesc });
              existing.length > 0 ? await base44.entities.GlobalSettings.update(existing[0].id, { setting_value: JSON.stringify(arr) }) : await base44.entities.GlobalSettings.create({ setting_key: 'earning_proof_images', setting_value: JSON.stringify(arr), is_enabled: true });
              queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Image added!');
            }} className="bg-white/20 hover:bg-white/30"><Plus className="w-4 h-4 mr-2" />Add Image</Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {(() => {
            const ev = globalSettings.filter(s => s.setting_key === 'earning_proof_images');
            if (!ev.length) return <p className="text-center text-gray-500 py-4">No images yet. Paste Google Drive image links above.</p>;
            const vd = ev[0].setting_value; const imgs = Array.isArray(typeof vd === 'string' ? JSON.parse(vd) : vd) ? (typeof vd === 'string' ? JSON.parse(vd) : vd) : [vd];
            return <div className="space-y-2 max-h-48 overflow-y-auto">{imgs.map((img, i) => (
              <div key={i} className="flex items-start justify-between p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex-1"><p className="font-medium text-sm">{img.title}</p><p className="text-xs text-gray-600 break-all">{img.url?.substring(0,50)}...</p></div>
                <Button size="sm" variant="destructive" className="h-7 ml-2" onClick={async () => {
                  if (confirm('Delete?')) { const updated = imgs.filter((_,j) => j!==i); updated.length ? await base44.entities.GlobalSettings.update(ev[0].id, { setting_value: JSON.stringify(updated) }) : await base44.entities.GlobalSettings.delete(ev[0].id); queryClient.invalidateQueries({ queryKey: ['global-settings'] }); }
                }}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}</div>;
          })()}
        </CardContent>
      </Card>

      {/* Earning Proof Videos */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle>🎥 Earning Proof Videos</CardTitle>
            <Button onClick={async () => {
              const videoTitle = prompt("Video title:"); if (!videoTitle) return;
              const videoUrl = prompt("Video URL:"); if (!videoUrl) return;
              const videoDescription = prompt("Description (optional):") || "";
              const existing = globalSettings.filter(s => s.setting_key === 'earning_proof_videos');
              let arr = [];
              if (existing.length > 0) { const d = existing[0].setting_value; arr = typeof d === 'string' ? JSON.parse(d) : d; if (!Array.isArray(arr)) arr = [arr]; }
              arr.push({ title: videoTitle, url: videoUrl, description: videoDescription });
              existing.length > 0 ? await base44.entities.GlobalSettings.update(existing[0].id, { setting_value: JSON.stringify(arr) }) : await base44.entities.GlobalSettings.create({ setting_key: 'earning_proof_videos', setting_value: JSON.stringify(arr), is_enabled: true });
              queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Added!');
            }} className="bg-white/20 hover:bg-white/30"><Plus className="w-4 h-4 mr-2" />Add Video</Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {(() => {
            const ev = globalSettings.filter(s => s.setting_key === 'earning_proof_videos');
            if (!ev.length) return <p className="text-center text-gray-500 py-6">No videos yet</p>;
            const vd = ev[0].setting_value; const videos = Array.isArray(typeof vd === 'string' ? JSON.parse(vd) : vd) ? (typeof vd === 'string' ? JSON.parse(vd) : vd) : [vd];
            return <div className="space-y-3 max-h-60 overflow-y-auto">{videos.map((v, i) => (
              <div key={i} className="flex items-start justify-between p-3 bg-purple-50 rounded border border-purple-200">
                <div className="flex-1"><p className="font-medium text-sm">{v.title}</p><p className="text-xs text-gray-600 break-all">{v.url}</p></div>
                <Button size="sm" variant="destructive" className="h-7" onClick={async () => {
                  if (confirm('Delete?')) { const updated = videos.filter((_,j) => j!==i); updated.length ? await base44.entities.GlobalSettings.update(ev[0].id, { setting_value: JSON.stringify(updated) }) : await base44.entities.GlobalSettings.delete(ev[0].id); queryClient.invalidateQueries({ queryKey: ['global-settings'] }); }
                }}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}</div>;
          })()}
        </CardContent>
      </Card>

      {/* Platform Off Mode */}
      <Card className="border-2 border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white"><CardTitle>🚫 Platform Off Mode</CardTitle></CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Status Indicator */}
          <div className={`p-4 rounded-xl border-2 ${platformOff ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{platformOff ? '🔴 PLATFORM OFF' : '✅ PLATFORM RUNNING'}</p>
                <p className="text-sm text-gray-600 mt-1">{platformOff ? 'All task submissions are blocked' : 'Platform is accepting submissions'}</p>
              </div>
              <Button 
                size="lg" 
                className={platformOff ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                onClick={async () => {
                  const existing = globalSettings.find(s => s.setting_key === 'platform_off_enabled');
                  const newVal = !platformOff;
                  existing ? 
                    await base44.entities.GlobalSettings.update(existing.id, { setting_value: newVal ? 'true' : 'false' }) : 
                    await base44.entities.GlobalSettings.create({ setting_key: 'platform_off_enabled', setting_value: newVal ? 'true' : 'false' });
                  setPlatformOff(newVal);
                  queryClient.invalidateQueries({ queryKey: ['global-settings'] }); 
                  alert(newVal ? '🔴 Platform turned OFF — all submissions blocked' : '✅ Platform turned ON');
                }}
              >
                {platformOff ? 'Turn ON' : 'Turn OFF'}
              </Button>
            </div>
          </div>

          {/* Message */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <Label className="font-bold text-amber-900">Message shown to users when offline</Label>
            <Textarea 
              placeholder="e.g., Platform closed for maintenance. Check back soon!"
              value={offMessage} 
              onChange={(e) => setOffMessage(e.target.value)}
              rows={3}
              className="border-amber-200 bg-white"
            />
            <Button 
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={async () => {
                const existing = globalSettings.find(s => s.setting_key === 'platform_off_message');
                existing ? 
                  await base44.entities.GlobalSettings.update(existing.id, { setting_value: offMessage }) : 
                  await base44.entities.GlobalSettings.create({ setting_key: 'platform_off_message', setting_value: offMessage, description: 'Message shown when platform is off' });
                queryClient.invalidateQueries({ queryKey: ['global-settings'] }); 
                alert('✅ Message saved!');
              }}
            >
              Save Custom Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Holiday */}
      <Card className="border-2 border-yellow-200">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"><CardTitle>🎉 Upcoming Holiday (Home Page)</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs text-gray-500">Shows on home page top bar. E.g. "Holiday on 15 Aug - Independence Day"</p>
          {globalSettings.find(s => s.setting_key === 'upcoming_holiday') && (
            <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-sm text-gray-700">
              <strong>Current:</strong> {globalSettings.find(s => s.setting_key === 'upcoming_holiday')?.setting_value}
            </div>
          )}
          <Input placeholder="e.g., Holiday on 15 Aug - Independence Day" id="upcoming-holiday-text" defaultValue={globalSettings.find(s => s.setting_key === 'upcoming_holiday')?.setting_value || ""} />
          <div className="flex gap-2">
            <Button onClick={async () => {
              const val = document.getElementById('upcoming-holiday-text').value.trim();
              const existing = globalSettings.find(s => s.setting_key === 'upcoming_holiday');
              if (!val) { if (existing) { await base44.entities.GlobalSettings.delete(existing.id); queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Holiday removed!'); } return; }
              existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: val }) : await base44.entities.GlobalSettings.create({ setting_key: 'upcoming_holiday', setting_value: val, description: 'Upcoming holiday shown on home page top bar' });
              queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Saved!');
            }} className="flex-1 bg-yellow-500 hover:bg-yellow-600">Save Holiday</Button>
            <Button onClick={async () => {
              const existing = globalSettings.find(s => s.setting_key === 'upcoming_holiday');
              if (existing) { await base44.entities.GlobalSettings.delete(existing.id); queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Holiday removed!'); }
            }} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">Remove</Button>
          </div>
        </CardContent>
      </Card>

      {/* Telecalling (Referral Partner) Video */}
      <Card className="border-2 border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-600 text-white"><CardTitle>📞 Telecalling Partner Video</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-3">
          {globalSettings.find(s => s.setting_key === 'referral_partner_video') && (
            <div className="p-3 bg-orange-50 rounded border border-orange-200 break-all text-xs text-gray-600">
              <p className="font-semibold mb-1">Current Link:</p>
              <p>{globalSettings.find(s => s.setting_key === 'referral_partner_video')?.setting_value}</p>
            </div>
          )}
          <Input placeholder="Enter Google Drive or YouTube video link" id="referral-partner-video-url" />
          <Button onClick={async () => {
            const url = document.getElementById('referral-partner-video-url').value; if (!url.trim()) return;
            const existing = globalSettings.find(s => s.setting_key === 'referral_partner_video');
            existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: url.trim() }) : await base44.entities.GlobalSettings.create({ setting_key: 'referral_partner_video', setting_value: url.trim(), description: 'Referral Partner page video link' });
            queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Referral Partner video updated!');
          }} className="w-full bg-orange-500 hover:bg-orange-600">Save Video Link</Button>
        </CardContent>
      </Card>

      {/* Tutorial Video (Home Page) */}
      <Card className="border-2 border-teal-200">
        <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white"><CardTitle>🎓 Home Page Tutorial Video</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs text-gray-500">This video appears on the Home page as "Watch Full Tutorial"</p>
          {globalSettings.find(s => s.setting_key === 'tutorial_video') && (
            <div className="p-3 bg-teal-50 rounded border border-teal-200 break-all text-xs text-gray-600">
              <p className="font-semibold mb-1">Current Link:</p>
              <p>{globalSettings.find(s => s.setting_key === 'tutorial_video')?.setting_value}</p>
            </div>
          )}
          <Input placeholder="Enter Google Drive or YouTube video link" id="tutorial-video-url" />
          <Button onClick={async () => {
            const url = document.getElementById('tutorial-video-url').value; if (!url.trim()) return;
            const existing = globalSettings.find(s => s.setting_key === 'tutorial_video');
            existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: url.trim() }) : await base44.entities.GlobalSettings.create({ setting_key: 'tutorial_video', setting_value: url.trim(), description: 'Home page tutorial video link' });
            queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Tutorial video updated!');
          }} className="w-full bg-teal-500 hover:bg-teal-600">Save Tutorial Video</Button>
        </CardContent>
      </Card>

      {/* Live Webinar */}
      <Card className="border-2 border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white"><CardTitle>🔴 Live Webinar Video</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs text-gray-500">This video plays inside the Training Module under "Live Webinar" tab</p>
          {globalSettings.find(s => s.setting_key === 'live_webinar_video') && (
            <div className="p-3 bg-red-50 rounded border border-red-200 break-all text-xs text-gray-600">
              <p className="font-semibold mb-1">Current Link:</p>
              <p>{globalSettings.find(s => s.setting_key === 'live_webinar_video')?.setting_value}</p>
            </div>
          )}
          <Input placeholder="Enter Google Drive or YouTube live/video link" id="live-webinar-url" />
          <Button onClick={async () => {
            const url = document.getElementById('live-webinar-url').value; if (!url.trim()) return;
            const existing = globalSettings.find(s => s.setting_key === 'live_webinar_video');
            existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: url.trim() }) : await base44.entities.GlobalSettings.create({ setting_key: 'live_webinar_video', setting_value: url.trim(), description: 'Live webinar video link' });
            queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Live Webinar video updated!');
          }} className="w-full bg-red-500 hover:bg-red-600">Save Live Webinar Link</Button>
        </CardContent>
      </Card>

      {/* How to Submit Task Video */}
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"><CardTitle>📤 "How to Submit Task" Video</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs text-gray-500">Shown inside "Submit Task" dialog as demo video</p>
          {globalSettings.find(s => s.setting_key === 'submit_task_video') && (
            <div className="p-2 bg-green-50 rounded border border-green-200 text-xs text-gray-600 break-all">
              <strong>Current:</strong> {globalSettings.find(s => s.setting_key === 'submit_task_video')?.setting_value}
            </div>
          )}
          <Input placeholder="Paste Google Drive or YouTube link" id="submit-task-video-url" defaultValue={globalSettings.find(s => s.setting_key === 'submit_task_video')?.setting_value || ""} />
          <Button onClick={async () => {
            const url = document.getElementById('submit-task-video-url').value; if (!url.trim()) return;
            const existing = globalSettings.find(s => s.setting_key === 'submit_task_video');
            existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: url.trim() }) : await base44.entities.GlobalSettings.create({ setting_key: 'submit_task_video', setting_value: url.trim(), description: 'How to submit task video' });
            queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Saved!');
          }} className="w-full bg-green-600 hover:bg-green-700">Save Submit Task Video</Button>
        </CardContent>
      </Card>

      {/* Task History Help Video */}
      <Card className="border-2 border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white"><CardTitle>📋 "Task History" Help Video</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs text-gray-500">Shown on Task History page via "See How to Check History" button</p>
          {globalSettings.find(s => s.setting_key === 'task_history_video') && (
            <div className="p-2 bg-indigo-50 rounded border border-indigo-200 text-xs text-gray-600 break-all">
              <strong>Current:</strong> {globalSettings.find(s => s.setting_key === 'task_history_video')?.setting_value}
            </div>
          )}
          <Input placeholder="Paste Google Drive or YouTube link" id="task-history-video-url" defaultValue={globalSettings.find(s => s.setting_key === 'task_history_video')?.setting_value || ""} />
          <Button onClick={async () => {
            const url = document.getElementById('task-history-video-url').value; if (!url.trim()) return;
            const existing = globalSettings.find(s => s.setting_key === 'task_history_video');
            existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: url.trim() }) : await base44.entities.GlobalSettings.create({ setting_key: 'task_history_video', setting_value: url.trim(), description: 'Task history help video' });
            queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Saved!');
          }} className="w-full bg-indigo-600 hover:bg-indigo-700">Save Task History Video</Button>
        </CardContent>
      </Card>

      {/* Support Tickets Demo Video */}
      <Card className="border-2 border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-600 text-white"><CardTitle>🎫 "Support Tickets" Demo Video</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs text-gray-500">Shown on Support Tickets & History page via "Watch Demo" button</p>
          {globalSettings.find(s => s.setting_key === 'support_tickets_video') && (
            <div className="p-2 bg-orange-50 rounded border border-orange-200 text-xs text-gray-600 break-all">
              <strong>Current:</strong> {globalSettings.find(s => s.setting_key === 'support_tickets_video')?.setting_value}
            </div>
          )}
          <Input placeholder="Paste Google Drive or YouTube link" id="support-tickets-video-url" defaultValue={globalSettings.find(s => s.setting_key === 'support_tickets_video')?.setting_value || ""} />
          <Button onClick={async () => {
            const url = document.getElementById('support-tickets-video-url').value; if (!url.trim()) return;
            const existing = globalSettings.find(s => s.setting_key === 'support_tickets_video');
            existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: url.trim() }) : await base44.entities.GlobalSettings.create({ setting_key: 'support_tickets_video', setting_value: url.trim(), description: 'Support tickets demo video' });
            queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Saved!');
          }} className="w-full bg-orange-600 hover:bg-orange-700">Save Support Tickets Video</Button>
        </CardContent>
      </Card>

      {/* Download Work File Links */}
      <Card className="border-2 border-green-200 md:col-span-2">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardTitle>📥 Download Work File Links (Task 1, 2, 3)</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Configure Google Drive links for Data Entry & Form Filling task files. These links are used in "Download Work File" menu and task preview screens.</p>
          {[1, 2, 3].map(n => {
            const key = `download_task_${n}_link`;
            const current = globalSettings.find(s => s.setting_key === key)?.setting_value || '';
            return (
              <div key={key} className="border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm text-gray-700">Task {n} Download Link</p>
                {current && (
                  <div className="p-2 bg-green-50 rounded border border-green-200 text-xs text-gray-600 break-all mb-2">
                    <strong>Current:</strong> {current}
                  </div>
                )}
                <Input placeholder={`Paste Google Drive link for Task ${n}`} id={`download-task-${n}-url`} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={async () => {
                    const url = document.getElementById(`download-task-${n}-url`).value.trim(); if (!url) return;
                    const existing = globalSettings.find(s => s.setting_key === key);
                    existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: url }) : await base44.entities.GlobalSettings.create({ setting_key: key, setting_value: url, description: `Download link for Task ${n}` });
                    queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Saved!');
                  }} className="bg-green-600 hover:bg-green-700">Save Task {n} Link</Button>
                  {current && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      const existing = globalSettings.find(s => s.setting_key === key);
                      if (existing) { await base44.entities.GlobalSettings.delete(existing.id); queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Removed!'); }
                    }} className="border-red-300 text-red-600 hover:bg-red-50">Remove</Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Homepage Announcements */}
      <Card className="border-2 border-pink-200 md:col-span-2">
        <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white"><CardTitle>📢 Homepage Announcements (shown inside hero banner)</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-gray-500">These appear as colored bars below the stats pills in the dashboard hero section. Leave empty to hide.</p>
          {[1,2,3].map(n => {
            const textKey = n === 1 ? 'homepage_announcement' : `homepage_announcement_${n}`;
            const colorKey = n === 1 ? 'homepage_announcement_color' : `homepage_announcement_color_${n}`;
            const currentText = globalSettings.find(s => s.setting_key === textKey)?.setting_value || '';
            const currentColor = globalSettings.find(s => s.setting_key === colorKey)?.setting_value || 'blue';
            return (
              <div key={n} className="border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm text-gray-700">Announcement #{n}</p>
                <Input placeholder={`Announcement text #${n} (leave empty to hide)`} id={`ann-text-${n}`} defaultValue={currentText} />
                <Select defaultValue={currentColor} onValueChange={async (val) => {
                  const existing = globalSettings.find(s => s.setting_key === colorKey);
                  existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: val }) : await base44.entities.GlobalSettings.create({ setting_key: colorKey, setting_value: val });
                  queryClient.invalidateQueries({ queryKey: ['global-settings'] });
                }}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['blue','green','red','orange','purple'].map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={async () => {
                  const val = document.getElementById(`ann-text-${n}`).value.trim();
                  const existing = globalSettings.find(s => s.setting_key === textKey);
                  if (val) {
                    existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: val }) : await base44.entities.GlobalSettings.create({ setting_key: textKey, setting_value: val });
                  } else if (existing) {
                    await base44.entities.GlobalSettings.delete(existing.id);
                  }
                  queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Saved!');
                }} className="bg-pink-600 hover:bg-pink-700">Save Announcement #{n}</Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Download Work File Links */}
      <Card className="border-2 border-green-200 md:col-span-2">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"><CardTitle>📥 Download Work File Links (Task 1, 2, 3)</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Configure Google Drive links for Data Entry and Form Filling tasks. Links appear in "Download Work File" menu and task pages.</p>
          {[1, 2, 3].map(n => {
            const key = `download_task_${n}_link`;
            const current = globalSettings.find(s => s.setting_key === key)?.setting_value || '';
            return (
              <div key={n} className="border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm text-gray-700">Task {n} Download Link</p>
                {current && (
                  <div className="p-2 bg-green-50 rounded border border-green-200 text-xs text-gray-600 break-all">
                    <strong>Current:</strong> {current}
                  </div>
                )}
                <Input placeholder={`Paste Google Drive link for Task ${n}`} id={`download-task-${n}-url`} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={async () => {
                    const url = document.getElementById(`download-task-${n}-url`).value.trim(); if (!url) return;
                    const existing = globalSettings.find(s => s.setting_key === key);
                    existing ? await base44.entities.GlobalSettings.update(existing.id, { setting_value: url }) : await base44.entities.GlobalSettings.create({ setting_key: key, setting_value: url, description: `Download link for Task ${n}` });
                    queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Saved!');
                  }} className="bg-green-600 hover:bg-green-700">Save Task {n} Link</Button>
                  {current && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      const existing = globalSettings.find(s => s.setting_key === key);
                      if (existing) { await base44.entities.GlobalSettings.delete(existing.id); queryClient.invalidateQueries({ queryKey: ['global-settings'] }); alert('✅ Removed!'); }
                    }} className="border-red-300 text-red-600 hover:bg-red-50">Remove</Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Task Entry Notification */}
      <Card className="border-2 border-blue-200 md:col-span-2">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white"><CardTitle>📢 Task Entry Notification</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Show a popup notification when users access the Tasks section. Admin can set a custom message.</p>
          
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="font-semibold text-gray-800">Enable Task Entry Notification</p>
              <p className="text-xs text-gray-500 mt-1">Users will see a popup before accessing Tasks</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="task-notification-toggle"
                defaultChecked={globalSettings.find(s => s.setting_key === 'task_entry_notification_enabled')?.setting_value === 'true'}
                onChange={async (e) => {
                  const existing = globalSettings.find(s => s.setting_key === 'task_entry_notification_enabled');
                  const newVal = e.target.checked;
                  existing ? 
                    await base44.entities.GlobalSettings.update(existing.id, { setting_value: newVal ? 'true' : 'false' }) : 
                    await base44.entities.GlobalSettings.create({ setting_key: 'task_entry_notification_enabled', setting_value: newVal ? 'true' : 'false' });
                  queryClient.invalidateQueries({ queryKey: ['global-settings'] }); 
                  alert(newVal ? '✅ Task Entry Notification enabled' : '❌ Task Entry Notification disabled');
                }}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <p className="font-semibold text-gray-800 text-sm">Notification Message</p>
            <Textarea 
              id="task-notification-message"
              placeholder="Enter the message users will see before accessing Tasks. E.g., 'Please read the guidelines carefully before starting any task. Do not use copy/paste. Work honestly and get rewards.'"
              defaultValue={globalSettings.find(s => s.setting_key === 'task_entry_notification_message')?.setting_value || ""}
              rows={4}
              className="border-blue-200 bg-white"
            />
            <Button 
              onClick={async () => {
                const msg = document.getElementById('task-notification-message').value.trim();
                if (!msg) { alert('⚠️ Please enter a message'); return; }
                const existing = globalSettings.find(s => s.setting_key === 'task_entry_notification_message');
                existing ? 
                  await base44.entities.GlobalSettings.update(existing.id, { setting_value: msg }) : 
                  await base44.entities.GlobalSettings.create({ setting_key: 'task_entry_notification_message', setting_value: msg, description: 'Task entry notification message shown to users' });
                queryClient.invalidateQueries({ queryKey: ['global-settings'] }); 
                alert('✅ Message saved!');
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Message
            </Button>
          </div>

          {/* Color Picker */}
           <div className="space-y-2">
             <p className="font-semibold text-gray-800 text-sm">Header Color</p>
             <Select 
               defaultValue={globalSettings.find(s => s.setting_key === 'task_entry_notification_color')?.setting_value || 'amber'}
               onValueChange={async (val) => {
                 const existing = globalSettings.find(s => s.setting_key === 'task_entry_notification_color');
                 existing ? 
                   await base44.entities.GlobalSettings.update(existing.id, { setting_value: val }) : 
                   await base44.entities.GlobalSettings.create({ setting_key: 'task_entry_notification_color', setting_value: val, description: 'Task entry notification header color' });
                 queryClient.invalidateQueries({ queryKey: ['global-settings'] }); 
               }}
             >
               <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="amber">🟡 Amber (Gold)</SelectItem>
                 <SelectItem value="orange">🟠 Orange</SelectItem>
                 <SelectItem value="red">🔴 Red</SelectItem>
                 <SelectItem value="blue">🔵 Blue</SelectItem>
                 <SelectItem value="green">🟢 Green</SelectItem>
                 <SelectItem value="purple">🟣 Purple</SelectItem>
                 <SelectItem value="pink">🩷 Pink</SelectItem>
               </SelectContent>
             </Select>
           </div>

          {/* Preview */}
           <div className="border-t pt-4">
             <p className="font-semibold text-gray-800 text-sm mb-3">Preview</p>
             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
               <p className="text-gray-800 text-sm whitespace-pre-wrap">
                 {globalSettings.find(s => s.setting_key === 'task_entry_notification_message')?.setting_value || "No message set yet"}
               </p>
             </div>
           </div>
          </CardContent>
          </Card>

      {/* Training Videos */}
      <Card className="border-2 border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"><CardTitle>📹 Recorded Training Videos</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-4">
          <Select onValueChange={setSelectedTopic}>
            <SelectTrigger><SelectValue placeholder="Select Topic" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="General Training">General</SelectItem>
              <SelectItem value="Getting Started">Getting Started</SelectItem>
              {tasks.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Video Title" id="video-title" />
          <Input placeholder="Video URL" id="video-url" />
          <Button onClick={async () => {
            const title = document.getElementById('video-title').value; const url = document.getElementById('video-url').value;
            if (!selectedTopic || !url) { alert('⚠️ Fill all'); return; }
            await base44.entities.TrainingVideo.create({ task_name: selectedTopic, video_title: title || selectedTopic, video_url: url });
            queryClient.invalidateQueries({ queryKey: ['training-videos'] }); alert('✅ Added!');
          }} className="w-full bg-indigo-500">Add Video</Button>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {trainingVideos.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded">
                <div><p className="font-medium text-sm">{v.task_name}</p><p className="text-xs">{v.video_title}</p></div>
                <Button size="sm" variant="destructive" className="h-7" onClick={async () => { if (confirm('Delete?')) { await base44.entities.TrainingVideo.delete(v.id); queryClient.invalidateQueries({ queryKey: ['training-videos'] }); } }}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
