import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function DownloadFiles() {
  const [user, setUser] = useState(null);
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  const { data: globalSettings = [] } = useQuery({
    queryKey: ['global-settings'],
    queryFn: () => base44.entities.GlobalSettings.list(),
    placeholderData: []
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const savedUser = localStorage.getItem('workden_4_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); return; } catch (e) {}
    }
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {}
  };

  const downloadCategories = [
    {
      key: 'download_task_1_link',
      title: 'Task 1',
      description: 'Download the Excel sheet for Task 1.',
      icon: '📊',
      color: 'from-blue-500 to-blue-600'
    },
    {
      key: 'download_task_2_link',
      title: 'Task 2',
      description: 'Download the Excel sheet for Task 2.',
      icon: '📝',
      color: 'from-green-500 to-green-600'
    },
    {
      key: 'download_task_3_link',
      title: 'Task 3',
      description: 'Download the Excel sheet for Task 3.',
      icon: '📊',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const openVideo = (url) => {
    if (!url) { alert("No demo video available yet."); return; }
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1];
    const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
    const dialog = document.createElement('div');
    dialog.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    dialog.innerHTML = `<div style="width:100%;max-width:860px;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden;position:relative"><button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:10px;right:10px;z-index:10;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:18px">×</button><iframe src="${embedUrl}" style="width:100%;height:100%;border:none" allowfullscreen></iframe></div>`;
    document.body.appendChild(dialog);
    dialog.onclick = (e) => { if (e.target === dialog) dialog.remove(); };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📥 Download Work Files
          </h1>
          <p className="text-gray-600">Download Excel sheets for Data Entry and Form Filling tasks</p>
        </div>

        {/* Demo Video Button */}
        <div className="mb-8">
          <Button
            onClick={() => {
              const videoUrl = globalSettings.find(s => s.setting_key === 'download_files_demo')?.setting_value;
              openVideo(videoUrl);
            }}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 text-lg shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            🎬 Watch How to Download Files
          </Button>
        </div>

        {/* Download Categories */}
        <div className="space-y-4">
          {downloadCategories.map((category, idx) => {
            const setting = globalSettings.find(s => s.setting_key === category.key);
            const downloadLink = setting?.setting_value || '';
            const isEnabled = setting?.is_enabled !== false;

            return (
              <Card key={idx} className="border-2 border-gray-200 hover:border-blue-300 transition-colors shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl flex-shrink-0 shadow-lg`}>
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                        {isEnabled && downloadLink ? (
                          <a href={downloadLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            {downloadLink.includes('drive.google.com') ? 'Google Drive Link' : 'Download Link'}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Link not available yet</span>
                        )}
                      </div>
                    </div>

                    {isEnabled && downloadLink ? (
                      <a href={downloadLink} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
                        <Button className={`w-full md:w-auto bg-gradient-to-r ${category.color} hover:opacity-90 text-white font-bold py-6 px-8 shadow-lg`}>
                          <Download className="w-5 h-5 mr-2" />
                          Download Now
                        </Button>
                      </a>
                    ) : (
                      <Button disabled className="w-full md:w-auto bg-gray-300 text-gray-500 font-bold py-6 px-8">
                        <Download className="w-5 h-5 mr-2" />
                        Not Available
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Important Note */}
        <Card className="mt-8 border-2 border-amber-300 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Important Instructions:</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Download the Excel file before starting your task</li>
                  <li>• Complete the work according to the given instructions</li>
                  <li>• Submit your completed file via Google Drive/Dropbox link</li>
                  <li>• Do not share these files with anyone</li>
                  <li>• Each task has a unique file — download the correct one</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
