import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Detects when an admin force-submits the current user's task in real-time.
 * Uses base44 entity subscription on AppUser to watch for force_submitted_at changes.
 *
 * @param {object} user - current AppUser record (needs user.id and user.login_user_id)
 * @param {string} taskName - current active task name (e.g. "Data Entry Task 1")
 * @param {function} onForceSubmit - called when force submit is detected
 */
export function useForceSubmitDetector(user, taskName, onForceSubmit) {
  const handledRef = useRef(null); // track which force_submitted_at we already handled
  const onForceSubmitRef = useRef(onForceSubmit);
  onForceSubmitRef.current = onForceSubmit;

  useEffect(() => {
    if (!user?.id || !taskName) return;

    // Seed with current value so we don't false-fire on mount
    handledRef.current = user.force_submitted_at || null;

    const handleEvent = (event) => {
      // Firebase proxy returns payload, not data
      const data = event.payload || event.data;
      if (!data) return;

      // Only care about updates to THIS user
      const isSameDocId = data.id === user.id;
      const isSameLoginId = Boolean(data.login_user_id && user.login_user_id && data.login_user_id === user.login_user_id);
      if (!isSameDocId && !isSameLoginId) return;
      
      // Firebase proxy maps docChanges types ('added', 'modified', 'removed').
      if (event.type !== 'update' && event.type !== 'modified') return;

      const newTs = data.force_submitted_at;
      const newTask = data.force_submitted_task || '';

      if (!newTs) return;
      if (newTs === handledRef.current) return; // already handled this event

      // PREVENT OLD FORCE SUBMITS FROM TRIGGERING (if local cache was missing it)
      const tsTime = new Date(newTs).getTime();
      const now = Date.now();
      if (now - tsTime > 60000) {
        handledRef.current = newTs; // It's an old event, mark handled and ignore
        return;
      }

      // Check the task name matches (or is empty — admin submitted something for this user)
      const currentTaskLower = taskName.toLowerCase();
      const submittedTaskLower = newTask.toLowerCase();
      const taskMatches = !newTask ||
        submittedTaskLower === currentTaskLower ||
        submittedTaskLower.includes(currentTaskLower) ||
        currentTaskLower.includes(submittedTaskLower);

      if (!taskMatches) return;

      handledRef.current = newTs; // mark as handled
      onForceSubmitRef.current();
    };

    const unsubAppUser = base44.entities.AppUser.subscribe(handleEvent);
    const unsubUser = base44.entities.User.subscribe(handleEvent);

    return () => {
      unsubAppUser();
      unsubUser();
    };
  }, [user?.id, taskName]);
}