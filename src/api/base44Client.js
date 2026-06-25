import { auth, db } from './firebaseConfig';
import { 
  collection, getDocs, query, where, addDoc, updateDoc, doc, onSnapshot, orderBy, deleteDoc, limit
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signOut, updateProfile
} from 'firebase/auth';

// ─── SORT HELPER ─────────────────────────────────────────────────────────────
const sortByDate = (docs) => {
  docs.sort((a, b) => {
    const tA = new Date(a.created_date || a.submitted_date || a.timestamp || 0).getTime();
    const tB = new Date(b.created_date || b.submitted_date || b.timestamp || 0).getTime();
    return tB - tA;
  });
  return docs;
};

// ─── ENTITY API FACTORY ──────────────────────────────────────────────────────
// DESIGN: Firebase persistent cache is enabled (firebaseConfig.js).
// - getDocs() returns cached data immediately if available, then syncs in background.
// - onSnapshot listeners (used in Layout.jsx) keep the cache fresh in real-time.
// - This means getDocs() returns FRESH data because onSnapshot already updated the cache.
// - NO timeouts or getDocsFromServer needed — Firebase handles it natively.
const createEntityApi = (collectionName) => {
  const colRef = collection(db, collectionName);
  return {
    filter: async (criteria) => {
      let q = query(colRef);
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined && value !== null) {
          q = query(q, where(key, '==', value));
        }
      }
      const snapshot = await getDocs(q);
      return sortByDate(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    },

    list: async (order, count) => {
      let q = query(colRef);
      if (order) {
        const field     = order.startsWith('-') ? order.substring(1) : order;
        const direction = order.startsWith('-') ? 'desc' : 'asc';
        q = query(q, orderBy(field, direction));
      }
      if (count) {
        q = query(q, limit(count));
      }
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return order ? docs : sortByDate(docs);
    },

    create: async (data) => {
      const docRef = await addDoc(colRef, { ...data, created_date: new Date().toISOString() });
      return { id: docRef.id, ...data };
    },

    update: async (id, data) => {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);
      return { id, ...data };
    },

    delete: async (id) => {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return id;
    },

    subscribe: (callback) => {
      return onSnapshot(
        colRef,
        (snapshot) => {
          const events = snapshot.docChanges().map(change => ({
            type: change.type,
            payload: { id: change.doc.id, ...change.doc.data() }
          }));
          events.forEach(event => callback(event));
        },
        (err) => console.warn(`[subscribe] ${collectionName} error:`, err?.message)
      );
    },
    
    subscribeAll: (callback, options = {}) => {
      let q = colRef;
      if (options.order) {
        const field     = options.order.startsWith('-') ? options.order.substring(1) : options.order;
        const direction = options.order.startsWith('-') ? 'desc' : 'asc';
        q = query(q, orderBy(field, direction));
      }
      if (options.limitCount) {
        q = query(q, limit(options.limitCount));
      }
      return onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          callback(options.order ? docs : sortByDate(docs));
        },
        (err) => console.warn(`[subscribeAll] ${collectionName} error:`, err?.message)
      );
    },

    subscribeDoc: (id, callback) => {
      try {
        const dRef = doc(db, collectionName, id);
        return onSnapshot(
          dRef,
          (snapshot) => {
            if (snapshot.exists()) {
              callback({ id: snapshot.id, data: snapshot.data() });
            }
          },
          (err) => console.warn(`[subscribeDoc] ${collectionName}/${id} error:`, err?.message)
        );
      } catch (e) {
        console.warn('[subscribeDoc] setup error:', e?.message);
        return () => {};
      }
    }
  };
};

// ─── MAIN BASE44 EXPORT ───────────────────────────────────────────────────────
export const base44 = {
  auth: {
    me: () => new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          resolve({ id: user.uid, email: user.email, ...user });
        } else {
          try {
            const savedUser = localStorage.getItem('workden_4_user');
            if (savedUser) resolve(JSON.parse(savedUser));
            else resolve(null);
          } catch (e) {
            resolve(null);
          }
        }
      });
    }),
    logout: async (redirectUrl) => {
      await signOut(auth);
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin: () => {
      window.location.href = '/UserLogin';
    },
    updateMe: async (data) => {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, data);
      }
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'workden_unsigned');
        const res = await fetch('https://api.cloudinary.com/v1_1/dynrihmjd/auto/upload', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Upload failed');
        }
        const data = await res.json();
        return { file_url: data.secure_url };
      }
    }
  },
  entities: new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        if (!target[prop]) {
          target[prop] = createEntityApi(prop);
        }
        return target[prop];
      }
    }
  })
};
