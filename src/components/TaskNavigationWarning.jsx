import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock } from "lucide-react";
import { useTaskLock } from "@/lib/TaskLockContext";

// Task pages - navigation WITHIN these is allowed
const TASK_PAGES = ['DataEntry', 'FormFilling', 'GrammarCorrection', 'EbookTyping', 'CaptchaFilling', 'TaskWorkspace', 'CopyPaste', 'ChatSupport', 'PdfToWordTyping', 'Typing'];

function isTaskPage(href) {
  return TASK_PAGES.some(p => href && href.includes(p));
}

export default function TaskNavigationWarning() {
  const { isTaskActive, lockAndLeave } = useTaskLock();
  const [showWarning, setShowWarning] = React.useState(false);
  const [locking, setLocking] = React.useState(false);
  const pendingDest = useRef(null);
  const isActiveRef = useRef(false);

  // Keep a ref in sync so event handlers always see latest value
  useEffect(() => {
    isActiveRef.current = isTaskActive;
  }, [isTaskActive]);

  useEffect(() => {
    // beforeunload — triggers on browser close, tab close, and page refresh
    const handleBeforeUnload = (e) => {
      if (!isActiveRef.current) return;
      e.preventDefault();
      e.returnValue = "⚠️ Your task will be locked if you leave. Are you sure?";
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!isTaskActive) return;

    // Push dummy state so back button fires popstate
    window.history.pushState(null, '', window.location.href);

    // Intercept ALL clicks — catches both <a> and React Router <Link> (which renders as <a>)
    const handleClick = (e) => {
      if (!isActiveRef.current) return;

      // Find the nearest anchor
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href') || '';

      // Allow clicks with no real navigation, hash-only, or within task pages
      if (!href || href === '#' || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('upi')) return;
      if (isTaskPage(href)) return;

      // It's navigation away from a task — intercept!
      e.preventDefault();
      e.stopPropagation();
      pendingDest.current = href;
      setShowWarning(true);
    };

    // Intercept keyboard shortcuts (Escape key especially)
    const handleKeyDown = (e) => {
      if (!isActiveRef.current) return;
      // Block Alt+Left (browser back), Alt+F4 hint via Escape handling
      if ((e.altKey && e.key === 'ArrowLeft') || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        pendingDest.current = '/Tasks';
        setShowWarning(true);
      }
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isTaskActive]);

  const handleLockAndLeave = async () => {
    setLocking(true);
    await lockAndLeave(pendingDest.current || '/Tasks');
    setLocking(false);
    setShowWarning(false);
  };

  const handleStay = () => {
    setShowWarning(false);
    pendingDest.current = null;
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent
        hideClose={true}
        className="max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="bg-red-50 px-6 py-4 flex items-center justify-center border-b border-red-100">
          <DialogTitle className="flex items-center gap-2 text-red-600 text-lg sm:text-xl font-bold m-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            Warning: Task In Progress!
          </DialogTitle>
        </div>
        
        <div className="px-6 py-5 space-y-4 bg-white">
          <DialogDescription className="text-gray-700 leading-relaxed text-base">
            Are you sure you want to exit? Your task will be <strong className="text-red-600 font-bold bg-red-50 px-1 rounded">LOCKED</strong> immediately and can only be retried <strong>tomorrow after 7:00 AM</strong>.
          </DialogDescription>

          <div className="p-4 bg-red-50/80 border border-red-100 rounded-lg shadow-inner">
            <ul className="text-sm text-red-800 space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-red-500">🔒</span> Task will be <strong className="text-red-700">LOCKED immediately</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">❌</span> You cannot restart the task today
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">⏰</span> Retry only allowed next day after 7:00 AM
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={handleStay}
            className="flex-1 border-2 border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800 font-bold py-6 sm:py-2 transition-all shadow-sm"
          >
            ✅ No, Continue Task
          </Button>
          <Button
            onClick={handleLockAndLeave}
            disabled={locking}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-6 sm:py-2 transition-all shadow-sm"
          >
            <Lock className="w-4 h-4 mr-2" />
            {locking ? "Locking..." : "Yes, Exit & Lock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
