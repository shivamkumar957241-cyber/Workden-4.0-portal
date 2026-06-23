import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Clock, Shield, FileText, CreditCard, Upload } from "lucide-react";

export default function Guidelines() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
            📋 WorkDen Guidelines
          </h1>
          <p className="text-gray-600">Complete guide to using WorkDen platform</p>
        </div>

        {/* Working Hours */}
        <Card className="mb-6 shadow-xl border-l-4 border-l-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Clock className="w-6 h-6" />
              ⏰ Working Hours & Timings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
              <h3 className="font-bold text-indigo-900 mb-2 text-lg">📅 Working Days</h3>
              <p className="text-xl font-bold text-indigo-700">Monday to Sunday (All 7 Days)</p>
              <p className="text-sm text-green-600 font-semibold mt-1">✅ Sunday is also a working day — tasks available 7:00 AM – 11:30 PM</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <h3 className="font-bold text-blue-900 mb-2">⏰ Tasks Active Time</h3>
                <p className="text-2xl font-bold text-blue-700">7:00 AM - 11:30 PM</p>
                <p className="text-sm text-blue-600">Tasks can only be started during these hours</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <h3 className="font-bold text-green-900 mb-2">Task Approval</h3>
                <p className="text-2xl font-bold text-green-700">7:00 PM - 10:00 PM</p>
                <p className="text-sm text-green-600">Our team reviews submissions</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                <h3 className="font-bold text-purple-900 mb-2">Withdrawal Approval</h3>
                <p className="text-2xl font-bold text-purple-700">8:00 PM - 11:00 PM</p>
                <p className="text-sm text-purple-600">Payment processing time</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                <h3 className="font-bold text-orange-900 mb-2">ID Verification</h3>
                <p className="text-2xl font-bold text-orange-700">7:00 PM - 10:00 PM</p>
                <p className="text-sm text-orange-600">Our team reviews account activation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Submit Tasks — New Method */}
        <Card className="mb-6 shadow-xl border-l-4 border-l-green-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Upload className="w-6 h-6" />
              📤 How to Submit Tasks (New Method)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-3 bg-green-100 border-2 border-green-400 rounded-xl text-center">
              <p className="text-green-800 font-bold text-sm">✅ WorkDen 4.0 uses Direct Submission — no file upload or Google Drive required!</p>
            </div>
            <div className="space-y-4">
              {[
                { n: 1, title: "Go to Tasks Page", desc: "Open the Tasks menu and select your assigned task category (Data Entry, Form Filling, PDF to Word, or Grammar Correction)." },
                { n: 2, title: "Select Task Type (Task 1, 2, or 3)", desc: "Each category has 3 sub-tasks. You must start Task 1 first — Task 2 and Task 3 will unlock after completing the previous one." },
                { n: 3, title: "Click \"I'm Starting The Task\"", desc: "Read the task preview and instructions carefully, then click Start. The 8-hour timer begins immediately." },
                { n: 4, title: "Type Your Work Manually", desc: "Fill in all the fields by typing. Copy-paste is strictly disabled. You must type each entry yourself. Paste attempts are recorded." },
                { n: 5, title: "Save Each Entry/Item", desc: "Click the \"Save\" button after completing each entry. Saved items are stored automatically in the system." },
                { n: 6, title: "Click Submit Task", desc: "After saving your items, scroll to the bottom and click \"Submit Task\". Your work is directly submitted to our team for review — no file upload needed." },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{n}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{title}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl">
              <p className="text-amber-800 text-sm">⚠️ After submission, only the success message will be shown. The task content will be hidden. Check your submission status in Task History (Menu → Task History).</p>
            </div>
          </CardContent>
        </Card>

        {/* ID Verification */}
        <Card className="mb-6 shadow-xl border-l-4 border-l-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <CreditCard className="w-6 h-6" />
              🆔 ID Card Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> Your account must be verified before you can start working. You need to submit the ID card provided by WorkDen.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                "Take a clear photo of your ID card",
                "Upload to Google Drive",
                "Set access to \"Anyone with the link can view\"",
                "Go to Profile → Paste the link in ID Card section",
                "Our team will verify within 24 hours",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card className="mb-6 shadow-xl border-l-4 border-l-teal-500">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <Shield className="w-6 h-6" />
              💰 Payment & Withdrawal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-teal-50 rounded-lg border-2 border-teal-300 text-center">
                <h3 className="font-bold text-teal-900 mb-1">Minimum Withdrawal</h3>
                <p className="text-3xl font-bold text-teal-700">₹500</p>
                <p className="text-xs text-teal-600 mt-1">Minimum amount to withdraw</p>
              </div>
              <div className="p-4 bg-cyan-50 rounded-lg border-2 border-cyan-300 text-center">
                <h3 className="font-bold text-cyan-900 mb-1">Processing Time</h3>
                <p className="text-3xl font-bold text-cyan-700">2-3 Hours</p>
                <p className="text-xs text-cyan-600 mt-1">Fast bank transfer</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300 text-center">
                <h3 className="font-bold text-blue-900 mb-1">Withdrawal Fee</h3>
                <p className="text-3xl font-bold text-blue-700">FREE</p>
                <p className="text-xs text-blue-600 mt-1">No charges on withdrawal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Types */}
        <Card className="mb-6 shadow-xl border-l-4 border-l-orange-500">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <FileText className="w-6 h-6" />
              💼 Available Work Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { name: "Data Entry", desc: "Fill 35 entries with personal data fields like name, phone, email, etc." },
                { name: "Form Filling", desc: "Complete 30 online forms with personal and professional details." },
                { name: "PDF to Word Typing", desc: "Type content from 37 PDF pages into Word format accurately." },
                { name: "Grammar Correction", desc: "Correct grammar errors in 40 English sentences." },
              ].map(t => (
                <div key={t.name} className="p-4 bg-gray-50 rounded-lg border border-orange-200">
                  <p className="font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Monitoring */}
        <Card className="mb-6 shadow-xl border-l-4 border-l-indigo-500">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Shield className="w-6 h-6" />
              🔍 Activity Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-800"><strong>Note:</strong> All user activities are monitored to ensure fair work practices and platform security.</p>
            </div>
            <div className="space-y-3">
              {[
                { title: "Session Tracking", desc: "Your login sessions and active time are recorded" },
                { title: "Task Progress", desc: "Time spent on each task is tracked" },
                { title: "Task Timer", desc: "Each task has 8 hours time limit" },
                { title: "IP Logging", desc: "Login locations are monitored for security" },
                { title: "Copy-Paste Disabled", desc: "Except for Copy-Paste task pages" },
                { title: "Right-Click Disabled", desc: "To protect platform content" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm"><strong>{item.title}:</strong> {item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Start Feature */}
        <Card className="mb-6 shadow-xl border-l-4 border-l-cyan-500">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-cyan-900">
              <Clock className="w-6 h-6" />
              🚀 "I'm Starting The Task" Feature
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg mb-4">
              <h3 className="font-bold text-cyan-900 mb-2">How Task Starting Works:</h3>
              <ol className="text-sm text-cyan-800 space-y-2 list-decimal list-inside">
                <li><strong>Preview Mode:</strong> First you'll see task details (read-only)</li>
                <li><strong>Click "I'm Starting The Task":</strong> This enables input and starts 8-hour countdown</li>
                <li><strong>Timer Starts:</strong> You have exactly 8 hours to complete</li>
                <li><strong>No Going Back:</strong> Once started, leaving will lock task until tomorrow 7:00 AM</li>
              </ol>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> Make sure you have enough time before clicking "I'm Starting The Task". Once clicked, the countdown begins and you cannot pause or go back.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="shadow-xl border-l-4 border-l-red-500">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-6 h-6" />
              ⚠️ Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {[
                { title: "8 Hour Time Limit", desc: "Each task must be completed within 8 hours of clicking \"I'm Starting The Task\"" },
                { title: "Time-Based Lock", desc: "Tasks are active only between 7:00 AM and 11:30 PM (all 7 days including Sunday). If you start a task and leave it incomplete, you will be able to continue the task only on the next day between 7:00 AM and 11:30 PM." },
                { title: "Copy-Paste Disabled", desc: "Paste is blocked on all tasks except Copy-Paste Work. You must type manually." },
                { title: "Direct Submission", desc: "No Google Drive or file upload required. Your work is submitted directly from the task page." },
                { title: "ID Verification", desc: "Account must be verified before withdrawing money" },
                { title: "Quality Work", desc: "Low quality submissions may be rejected" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700"><strong>{item.title}:</strong> {item.desc}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
