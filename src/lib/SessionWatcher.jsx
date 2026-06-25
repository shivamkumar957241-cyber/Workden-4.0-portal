import { useEffect } from 'react';
import { db } from '@/api/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

export default function SessionWatcher() {
  useEffect(() => {
    // Check every 2 seconds to support login/logout without full refresh
    let unsub = null;
    let currentUserId = null;

    const checkAndListen = () => {
      const userId = localStorage.getItem('workden_4_user_db_id');
      const userSource = localStorage.getItem('workden_4_user_source');
      
      if (userId && userSource === 'appuser' && userId !== currentUserId) {
        if (unsub) unsub();
        currentUserId = userId;
        unsub = onSnapshot(doc(db, 'AppUser', userId), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.is_logged_in === false) {
              // Check if it's a manual logout
              if (localStorage.getItem('workden_4_manual_logout')) {
                // Let the manual logout process finish
                return;
              }

              // Forced logout!
              localStorage.removeItem('workden_4_login_id');
              localStorage.removeItem('workden_4_login_password');
              localStorage.removeItem('workden_4_user');
              localStorage.removeItem('workden_4_user_db_id');
              localStorage.removeItem('workden_4_user_source');
              localStorage.removeItem('workden_4_session_id');
              localStorage.removeItem('workden_4_session_fingerprint');
              if (!window.location.hash.includes('/UserLogin')) {
                alert("Your account has been logged out by the administration.");
                window.location.href = '#/UserLogin';
              }
            }
          }
        });
      } else if (!userId && unsub) {
        unsub();
        unsub = null;
        currentUserId = null;
      }
    };

    checkAndListen();
    const interval = setInterval(checkAndListen, 2000);

    return () => {
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, []);

  return null;
}
