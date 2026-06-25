import { useEffect, useRef } from 'react';
import { db } from '@/api/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

export default function SessionWatcher() {
  const unsubRef = useRef(null);
  const currentUserIdRef = useRef(null);

  useEffect(() => {
    // Check every 5 seconds (was 2s - reduced to avoid unnecessary checks)
    const checkAndListen = () => {
      const userId = localStorage.getItem('workden_4_user_db_id');
      const userSource = localStorage.getItem('workden_4_user_source');

      if (userId && userSource === 'appuser' && userId !== currentUserIdRef.current) {
        if (unsubRef.current) unsubRef.current();
        currentUserIdRef.current = userId;

        unsubRef.current = onSnapshot(
          doc(db, 'AppUser', userId),
          (docSnap) => {
            if (!docSnap.exists()) return;
            const data = docSnap.data();

            if (data.is_logged_in === false) {
              // ─── FIX: Check manual logout flag BEFORE doing anything ───
              // The flag is set at the START of performLogout(), so if it's present,
              // this is a manual logout — do NOT show the "admin logged you out" message.
              const isManualLogout = localStorage.getItem('workden_4_manual_logout');
              if (isManualLogout) return; // manual logout is handling cleanup itself

              // Also check if we are already on the login page
              if (window.location.hash.includes('/UserLogin')) return;

              // ─── FORCED LOGOUT by admin ───
              const keysToRemove = [
                'workden_4_login_id', 'workden_4_login_password', 'workden_4_user',
                'workden_4_user_db_id', 'workden_4_user_source', 'workden_4_session_id',
                'workden_4_session_fingerprint',
              ];
              keysToRemove.forEach(k => localStorage.removeItem(k));
              alert("⚠️ Your account has been logged out by the administration.");
              window.location.href = '#/UserLogin';
            }
          },
          (err) => {
            console.warn('[SessionWatcher] onSnapshot error:', err?.message);
          }
        );
      } else if (!userId && unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
        currentUserIdRef.current = null;
      }
    };

    checkAndListen();
    const interval = setInterval(checkAndListen, 5000);

    return () => {
      clearInterval(interval);
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  return null;
}
