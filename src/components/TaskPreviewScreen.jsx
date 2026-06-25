import React, { useState, useEffect } from "react";
import { ArrowLeft, Play, Clock, Shield, Download, Ban, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TASK_CONFIG = {
"Data Entry": {
  total: 35, minCorrect: 34, unit: "Entries", hasExcel: false,
  fields: [["Full Name","full_name"],["Phone Number","phone"],["Email Address","email"],["Aadhar Number","aadhar"],["Pan Number","pan"],["Qualification","qualification"]],
  previewItems: [
    { label: "Item #1 — Sample Data Entry", text: "Full Name: Rahul Sharma\nPhone Number: 9876543210\nEmail Address: rahul@email.com\nAadhar Number: 1234 5678 9012\nPan Number: ABCDE1234F\nQualification: B.Com\nFull Address: 12, MG Road, Bangalore\nCity: Bangalore\nState: Karnataka\nPin Code: 560001\nDOB: 15/08/1995\nGender: Male\nSalary: 25000" },
    { label: "Item #2 — Sample Data Entry", text: "Full Name: Priya Patel\nPhone Number: 8765432109\nEmail Address: priya@email.com\nAadhar Number: 9876 5432 1098\nPan Number: FGHIJ5678K\nQualification: MBA\nFull Address: 45, Ring Road, Ahmedabad\nCity: Ahmedabad\nState: Gujarat\nPin Code: 380001\nDOB: 22/03/1990\nGender: Female\nSalary: 35000" },
  ]
},
"Form Filling": {
  total: 30, minCorrect: 29, unit: "Forms", hasExcel: false,
  fields: [["Full Name","full_name"],["Email Address","email"],["Phone Number","phone"],["Alt. Phone","alt_phone"],["Aadhar Number","aadhar"],["Pan Number","pan"]],
  previewItems: [
    { label: "Form #1 — Sample Form", text: "Full Name: Amit Kumar\nEmail Address: amit@email.com\nPhone Number: 7654321098\nAlt. Phone: 8765432109\nAadhar Number: 2345 6789 0123\nPan Number: LMNOP9012Q\nDate of Birth: 10/05/1988\nGender: Male\nCity: Mumbai\nState: Maharashtra" },
    { label: "Form #2 — Sample Form", text: "Full Name: Sneha Verma\nEmail Address: sneha@email.com\nPhone Number: 6543210987\nAlt. Phone: 7654321098\nAadhar Number: 3456 7890 1234\nPan Number: RSTUV3456W\nDate of Birth: 28/11/1993\nGender: Female\nCity: Delhi\nState: Delhi" },
  ]
},
  "PDF to Word Typing": {
    total: 37, minCorrect: 36, unit: "Pages", hasExcel: false,
    previewItems: [
      { label: "Page 1 — Company Introduction Letter", text: "Dear Sir/Madam, We are pleased to introduce our organization, XYZ Enterprises Pvt. Ltd., established in 2005 with a vision to deliver quality services across multiple industries. Our company has grown with a dedicated team of over 500 professionals across 12 cities in India..." },
      { label: "Page 2 — Bank Account Opening Form", text: "Instructions for Filling the Account Opening Form: 1. Fill all fields in BLOCK LETTERS using blue or black ink only. 2. Attach one recent passport-size photograph. 3. Self-attested copies of Aadhaar Card, PAN Card, or Passport must be submitted..." },
    ]
  },
  "Grammar Correction": {
    total: 40, minCorrect: 38, unit: "Items", hasExcel: false,
    previewItems: [
      { label: "Incorrect Text — Item #1", text: "The children was playing in the garden when their mother called they for dinner. Each of them have left their toys on the grass and runned inside quickly..." },
      { label: "Incorrect Text — Item #2", text: "She don't know how to swimming but she want to learn it this summer. Her friend have promised to teaches her every weekend at the community pool near their neighbourhood..." },
    ]
  },
};

function getBaseTaskName(taskName) {
  return taskName.replace(/ Task \d+$/, '');
}

export default function TaskPreviewScreen({ taskName, reward, onStart, onBack }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);

  const baseName = getBaseTaskName(taskName);
  const taskSlot = parseInt(taskName.match(/Task (\d+)/)?.[1] || '1');
  const config = TASK_CONFIG[baseName] || { total: 30, minCorrect: 29, unit: "Items", hasExcel: false };

  useEffect(() => {
    base44.entities.TrainingVideo.filter({ task_name: baseName })
      .then(videos => { if (videos?.length > 0) setVideoUrl(videos[0].video_url); })
      .catch(() => {});

    if (baseName === 'Data Entry' || baseName === 'Form Filling') {
      const settingKey = `download_task_${taskSlot}_link`;
      base44.entities.GlobalSettings.filter({ setting_key: settingKey })
        .then(settings => { if (settings?.length > 0) setDownloadLink(settings[0].setting_value); })
        .catch(() => {});
    }
  }, [baseName, taskSlot]);

  const openVideo = () => {
    if (!videoUrl) { alert("No demo video available for this task yet."); return; }
    const fileId = videoUrl.match(/\/file\/d\/([^/]+)/)?.[1];
    const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : videoUrl;
    const dialog = document.createElement('div');
    dialog.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    dialog.innerHTML = `<div style="width:100%;max-width:860px;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden;position:relative"><button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:10px;right:10px;z-index:10;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:18px">×</button><iframe src="${embedUrl}" style="width:100%;height:100%;border:none" allowfullscreen></iframe></div>`;
    document.body.appendChild(dialog);
    dialog.onclick = (e) => { if (e.target === dialog) dialog.remove(); };
  };

  const itemBgStyles = [
    { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
    { background: 'linear-gradient(135deg, #0f766e, #0d9488)' },
  ];

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div>
          <h1 className="text-base font-bold text-blue-700">{baseName}</h1>
          <p className="text-xs text-gray-400">Review before starting</p>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="border-2 border-blue-100 rounded-3xl p-4 space-y-4 bg-white shadow-sm">

          {/* Task Preview Header Card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #6B46C1 0%, #8B5CF6 50%, #A78BFA 100%)' }}>
            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">📋</div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">TASK PREVIEW</p>
                <p className="text-white text-xl font-black">{baseName}</p>
              </div>
            </div>
            <div className="mx-4 mb-4 bg-white/20 rounded-xl p-4 text-center">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">TOTAL WORK</p>
              <p className="text-white text-4xl font-black">{config.total}</p>
              <p className="text-white/80 text-sm">{config.unit}</p>
            </div>
          </div>

          {/* Watch Demo Video */}
          <button
            onClick={openVideo}
            className="w-full text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg transition-colors"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
          >
            <Play className="w-4 h-4" />
            🎬 Watch Demo Video
          </button>

          {/* Excel Download */}
          {(baseName === 'Data Entry' || baseName === 'Form Filling') && (
            <div className="rounded-2xl overflow-hidden border-2 border-blue-400">
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #1d4ed8, #2563eb)' }}>
                <span className="text-white text-sm font-black uppercase tracking-wide">📊 Excel Sheet Download</span>
              </div>
              <div className="bg-blue-50 p-3">
                <p className="text-blue-800 text-xs font-semibold mb-3">
                  Download the Excel sheet before starting. Fill as per instructions, then submit your completed file.
                </p>
                {downloadLink ? (
                  <a href={downloadLink} target="_blank" rel="noopener noreferrer" className="block">
                    <button className="w-full text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md" style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}>
                      <Download className="w-4 h-4" />
                      Download Excel Sheet — Task {taskSlot}
                    </button>
                  </a>
                ) : (
                  <button disabled className="w-full bg-gray-200 text-gray-400 text-sm font-semibold py-2.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Excel Sheet — Not Available Yet
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Minimum Accuracy */}
          <div className="rounded-2xl overflow-hidden border-2 border-yellow-500">
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #d97706, #dc2626)' }}>
              <span className="text-lg">🎯</span>
              <p className="text-white text-sm font-black uppercase tracking-wide">MINIMUM ACCURACY REQUIRED</p>
            </div>
            <div className="bg-amber-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-red-700 text-3xl font-black">95%</p>
                    <p className="text-amber-700 text-xs font-bold">Accuracy Required</p>
                  </div>
                </div>
                <div className="bg-white border-2 border-green-500 rounded-xl p-3 text-center shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-700" />
                    <p className="text-green-800 text-xs font-bold">Correct Items Required</p>
                  </div>
                  <p className="text-gray-900 text-2xl font-black">{config.minCorrect} <span className="text-base font-semibold text-gray-600">out of {config.total}</span></p>
                  <p className="text-gray-600 text-xs">{config.unit}</p>
                </div>
              </div>
              <div className="bg-amber-200 border border-amber-500 rounded-xl p-2.5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-amber-900 text-xs font-semibold">Your task will be rejected if less than {config.minCorrect} entries are correct. Admin verifies every entry manually.</p>
              </div>
            </div>
          </div>

          {/* Strict Usage Policy */}
          <div className="rounded-2xl overflow-hidden border-2 border-red-500">
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #b91c1c, #be123c)' }}>
              <Ban className="w-4 h-4 text-white" />
              <p className="text-white text-sm font-black uppercase tracking-wide">STRICT USAGE POLICY</p>
            </div>
            <div className="bg-red-50 p-4 space-y-3">
              <div className="bg-white border-2 border-red-400 rounded-xl p-3">
                <p className="text-red-700 text-sm font-black mb-1.5">❌ Strictly Prohibited:</p>
                <p className="text-red-600 text-xs font-medium">• Use of AI tools / AI content generators</p>
                <p className="text-red-600 text-xs font-medium">• Copy-paste from websites, documents, or apps</p>
                <p className="text-red-600 text-xs font-medium">• Third-party apps, browser extensions, bots</p>
                <p className="text-red-600 text-xs font-medium">• Any non-manual, automated input method</p>
              </div>
              <div className="bg-white border-2 border-amber-400 rounded-xl p-3">
                <p className="text-amber-800 text-sm font-black mb-1.5">⚠️ Violation Consequences:</p>
                <p className="text-amber-700 text-xs font-medium">• <strong>1st Violation:</strong> Task rejected, no payment</p>
                <p className="text-amber-700 text-xs font-medium">• <strong>Repeated Violations:</strong> Account permanently banned</p>
              </div>
              <div className="bg-white border-2 border-green-400 rounded-xl p-3">
                <p className="text-green-700 text-sm font-black mb-1.5">✅ Mandatory Rules:</p>
                <p className="text-green-700 text-xs font-medium">• All entries must be original and manually typed</p>
                <p className="text-green-700 text-xs font-medium">• Work must be user-generated only</p>
              </div>
            </div>
          </div>

          {/* Task Rules */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-black text-gray-600 uppercase tracking-widest">TASK RULES</p>
            </div>
            <div className="space-y-2">
              <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl px-4 py-3 flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-700 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Time Limit: 8 Hours</p>
                  <p className="text-xs text-blue-600">Countdown starts after clicking Start</p>
                </div>
              </div>
              <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl px-4 py-3 flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-700 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Active Hours: 7:00 AM – 11:30 PM</p>
                  <p className="text-xs text-blue-600">Tasks unavailable outside these hours</p>
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-400 rounded-2xl px-4 py-3 flex items-center gap-3">
                <Ban className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800">Copy-Paste DISABLED</p>
                  <p className="text-xs text-red-600 font-semibold">You must type all entries manually</p>
                </div>
              </div>
            </div>
          </div>

          {/* Task Lock Warning */}
          <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-4 flex items-start gap-3">
            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
              <Lock className="w-4 h-4 text-amber-600" />
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-amber-900 text-sm font-bold mb-1">Task Lock Warning</p>
              <p className="text-amber-800 text-xs leading-relaxed">
                Once you start the task, if you exit or navigate away — the task will be <strong>locked until tomorrow 7:00 AM IST</strong>. You will not be able to restart it today.
              </p>
            </div>
          </div>

          {/* Sample Items Preview */}
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">SAMPLE ITEMS PREVIEW</p>
            {config.previewItems ? (
              config.previewItems.map((item, idx) => (
                <div key={idx} className="mb-3 bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 flex items-center gap-3" style={itemBgStyles[idx % 2]}>
                    <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-white text-xs font-black">{idx + 1}</div>
                    <p className="text-white text-sm font-bold">{item.label}</p>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{item.text}</p>
                  </div>
                </div>
              ))
            ) : (
              [0, 1].map((idx) => (
                <div key={idx} className="mb-3 bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 flex items-center gap-3" style={itemBgStyles[idx]}>
                    <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-white text-xs font-black">{idx + 1}</div>
                    <p className="text-white text-sm font-bold">Item #{idx + 1}</p>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {config.fields.map(([label, key]) => (
                        <div key={key} className="border border-gray-200 rounded-lg px-2 py-2 bg-gray-50">
                          <p className="text-xs text-gray-500 mb-1">{label} *</p>
                          <p className="text-xs text-gray-300 italic">Type here...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Admin review note */}
          <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-3">
            <p className="text-blue-700 text-xs text-center">
              📋 After you complete and submit the task, it will be reviewed by the admin. You can perform the same task again only after it is approved by the admin.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={onStart}
            className="w-full text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-xl transition-colors"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            <Play className="w-5 h-5" />
            I'm Starting The Task
          </button>
          <p className="text-center text-xs text-gray-400 pb-2">⏱ 8-hour countdown begins immediately after clicking</p>

        </div>{/* end white-bordered inner */}
      </div>
    </div>
  );
}
