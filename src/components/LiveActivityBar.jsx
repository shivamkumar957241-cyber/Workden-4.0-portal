import React, { useState, useEffect, useRef } from "react";

/**
 * LiveActivityBar — Real-time activity metrics bar shown during task
 * Props:
 *   startTime: timestamp (ms) when task started
 *   savedCount: number of saved items
 *   total: total items
 *   trackerRef: ref to expose metrics (typedChars, words, wpm, pastedChars, pasteAttempts, tabSwitches, backspaces)
 */
export default function LiveActivityBar({ startTime, savedCount, total, trackerRef, onMetricsUpdate }) {
  const [metrics, setMetrics] = useState({
    typedChars: 0, words: 0, wpm: 0,
    pastedChars: 0, pasteAttempts: 0,
    tabSwitches: 0, backspaces: 0,
  });
  const [elapsed, setElapsed] = useState(0);

  // Internal state tracked by key listeners
  const state = useRef({
    typedChars: 0, words: 0, wpm: 0,
    pastedChars: 0, pasteAttempts: 0,
    tabSwitches: 0, backspaces: 0,
    keystrokeTimestamps: [],
    lastSwitchHidden: null,
  });

  // Keep a ref to trackerRef so closures always see the latest
  const trackerRefRef = useRef(trackerRef);
  useEffect(() => { trackerRefRef.current = trackerRef; });

  useEffect(() => {
    if (!startTime) return;

    // Sync latest metrics to parent ref + push to DB via callback
    const syncToParent = () => {
      const s = state.current;
      s.words = Math.floor(s.typedChars / 5);
      const tr = trackerRefRef.current;
      if (tr) tr.current = { ...s };
      // Push to DB so force submit reads accurate values
      if (onMetricsUpdate) onMetricsUpdate({ ...s });
    };

    // Elapsed time ticker
    const timeTick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Listen for paste attempts blocked by layout (mobile clipboard)
    const onPasteAttempt = (e) => {
      const s = state.current;
      s.pasteAttempts++;
      s.pastedChars += (e.detail?.chars || 0);
      syncToParent();
    };
    window.addEventListener('workden_paste_attempt', onPasteAttempt);

    // PRIMARY: Input event — works on BOTH mobile (keyboard) and desktop
    // This is the single source of truth. onInput covers: insertText (mobile/desktop),
    // deleteContentBackward (backspace), insertFromPaste (mobile clipboard paste).
    // No keydown char tracking needed — avoids double-counting on desktop.
    // This is the single source of truth for character counting
    const onInput = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (!isEditable) return;

      const s = state.current;
      const inputType = e.inputType || '';

      // Backspace / delete
      if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward' || inputType === 'deleteByCut') {
        s.backspaces++;
        syncToParent();
        return;
      }

      // Paste via inputType (mobile clipboard bypasses paste event)
      if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') {
        s.pasteAttempts++;
        const pastedLen = e.data?.length || 0;
        s.pastedChars += pastedLen;
        syncToParent();
        return;
      }

      // Regular typing — insertText covers mobile keyboard, swipe, autocomplete
      if (inputType === 'insertText' && e.data) {
        s.typedChars += e.data.length;
        const now = Date.now();
        s.keystrokeTimestamps.push(now);
        const cutoff = now - 60000;
        s.keystrokeTimestamps = s.keystrokeTimestamps.filter(t => t >= cutoff);
        if (s.keystrokeTimestamps.length > 5) {
          const span = (now - s.keystrokeTimestamps[0]) / 60000;
          if (span > 0) s.wpm = Math.round((s.keystrokeTimestamps.length / 5) / span);
        }
        syncToParent();
        return;
      }

      // Fallback: composition text (CJK, some Android keyboards), or empty inputType
      if (!inputType || inputType === 'insertCompositionText' || inputType === 'insertReplacementText') {
        if (e.data) {
          s.typedChars += e.data.length;
          syncToParent();
        }
      }
    };

    // Keydown: intentionally empty — onInput handles all character/backspace tracking
    // on both desktop and mobile. Keeping the listener stub for paste (handled below).
    const onKeydown = (_e) => {};

    // Tab switch / visibility
    const onVisibility = () => {
      if (document.hidden) {
        state.current.tabSwitches++;
        syncToParent();
      }
    };

    // Paste event — fires on desktop ctrl+v. Mobile paste is captured via onInput insertFromPaste.
    // Use a timestamp to avoid double-counting when both onPaste and onInput(insertFromPaste) fire.
    const lastPasteTs = { t: 0 };
    const onPaste = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (!isEditable) return;
      // onInput(insertFromPaste) fires ~immediately after — skip if it already counted this paste
      const now = Date.now();
      if (now - lastPasteTs.t < 100) return; // deduplicate
      lastPasteTs.t = now;
      const s = state.current;
      s.pasteAttempts++;
      try {
        const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        s.pastedChars += text.length;
      } catch(_) {}
      syncToParent();
    };

    // Add listeners
    document.addEventListener('input', onInput, { capture: true, passive: true });
    document.addEventListener('keydown', onKeydown, { capture: true, passive: true });
    document.addEventListener('paste', onPaste, { capture: true, passive: true });
    document.addEventListener('visibilitychange', onVisibility, { capture: true });

    // Metrics UI update every 1s for better responsiveness
    const metricsTick = setInterval(() => {
      const s = state.current;
      s.words = Math.floor(s.typedChars / 5);
      setMetrics({ ...s });
      syncToParent();
    }, 1000);

    return () => {
      clearInterval(timeTick);
      clearInterval(metricsTick);
      window.removeEventListener('workden_paste_attempt', onPasteAttempt);
      document.removeEventListener('input', onInput, { capture: true, passive: true });
      document.removeEventListener('keydown', onKeydown, { capture: true, passive: true });
      document.removeEventListener('paste', onPaste, { capture: true, passive: true });
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [startTime]);

  // Expose on every render so parent always has latest
  useEffect(() => {
    const tr = trackerRefRef.current;
    if (tr) tr.current = { ...state.current };
  });

  const formatDuration = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  if (!startTime) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2 w-full overflow-x-auto overflow-y-hidden text-xs font-medium sticky top-[57px] z-10 shadow-sm" style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
      {/* Live dot */}
      <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200 flex-shrink-0" style={{ minWidth: 'max-content' }}>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></span>
        <span className="text-green-600 font-bold whitespace-nowrap">Live Activity</span>
      </div>

      <div className="flex items-center gap-0" style={{ minWidth: 'max-content' }}>
        <StatPill label="Chars Typed" value={metrics.typedChars} />
        <StatPill label="Words" value={metrics.words} />
        <StatPill label="WPM" value={metrics.wpm} />
        <StatPill label="Saved" value={`${savedCount}/${total}`} highlight />
        <StatPill label="Duration" value={formatDuration(elapsed)} />
        <StatPill label="Pasted Chars" value={metrics.pastedChars} warn={metrics.pastedChars > 0} />
        <StatPill label="Paste Attempts" value={metrics.pasteAttempts} warn={metrics.pasteAttempts > 0} />
        <StatPill label="Tab Switches" value={metrics.tabSwitches} warn={metrics.tabSwitches > 3} />
        <StatPill label="Backspaces" value={metrics.backspaces} />
      </div>
    </div>
  );
}

function StatPill({ label, value, highlight, warn }) {
  return (
    <div className={`flex items-center gap-1 px-3 border-r border-gray-200 py-1 whitespace-nowrap ${warn ? 'text-red-600' : highlight ? 'text-purple-700' : 'text-gray-600'}`}>
      <span className="text-gray-400 text-[10px] md:text-xs">{label}:</span>
      <span className={`font-bold text-xs md:text-sm ${warn ? 'text-red-600' : highlight ? 'text-purple-700' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
