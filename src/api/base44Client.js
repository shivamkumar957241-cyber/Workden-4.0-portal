import { auth, db } from './firebaseConfig';
import { 
  collection, getDocs, getDocsFromCache, query, where, addDoc, updateDoc, doc, onSnapshot, orderBy, deleteDoc
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signOut, updateProfile
} from 'firebase/auth';

const withTimeout = (promise, ms = 3000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
};

const createEntityApi = (collectionName) => {
  const colRef = collection(db, collectionName);
  return {
    filter: async (criteria) => {
      let q = query(colRef);
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined) {
           q = query(q, where(key, '==', value));
        }
      }
      let snapshot;
      try {
        snapshot = await withTimeout(getDocs(q), 4000);
      } catch (e) {
        console.warn('Network timeout/quota exceeded, falling back to cache for filter', e);
        snapshot = await getDocsFromCache(q);
      }
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => {
        const tA = new Date(a.created_date || a.submitted_date || a.timestamp || 0).getTime();
        const tB = new Date(b.created_date || b.submitted_date || b.timestamp || 0).getTime();
        return tB - tA;
      });
      return docs;
    },
    list: async (order) => {
      let q = query(colRef);
      if (order) {
        const field = order.startsWith('-') ? order.substring(1) : order;
        const direction = order.startsWith('-') ? 'desc' : 'asc';
        q = query(q, orderBy(field, direction));
      }
      let snapshot;
      try {
        snapshot = await withTimeout(getDocs(q), 4000);
      } catch (e) {
        console.warn('Network timeout/quota exceeded, falling back to cache for list', e);
        snapshot = await getDocsFromCache(q);
      }
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (!order) {
        docs.sort((a, b) => {
          const tA = new Date(a.created_date || a.submitted_date || a.timestamp || 0).getTime();
          const tB = new Date(b.created_date || b.submitted_date || b.timestamp || 0).getTime();
          return tB - tA;
        });
      }
      return docs;
    },
    create: async (data) => {
      let docRef;
      try {
        docRef = await withTimeout(addDoc(colRef, { ...data, created_date: new Date().toISOString() }), 4000);
      } catch(e) {
        // If timeout, addDoc offline will queue it, but the promise hangs.
        // We can just fake a success to UI if offline persistence is enabled.
        docRef = { id: `offline-${Date.now()}` };
      }
      return { id: docRef.id, ...data };
    },
    update: async (id, data) => {
      const docRef = doc(db, collectionName, id);
      try {
        await withTimeout(updateDoc(docRef, data), 4000);
      } catch(e) {}
      return { id, ...data };
    },
    delete: async (id) => {
      const docRef = doc(db, collectionName, id);
      try {
        await withTimeout(deleteDoc(docRef), 4000);
      } catch(e) {}
      return id;
    },
    subscribe: (callback) => {
      return onSnapshot(colRef, (snapshot) => {
        const events = snapshot.docChanges().map(change => ({
          type: change.type,
          payload: { id: change.doc.id, ...change.doc.data() }
        }));
        events.forEach(event => callback(event));
      });
    },
    subscribeDoc: (id, callback) => {
      const dRef = doc(db, collectionName, id);
      return onSnapshot(dRef, (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, data: snapshot.data() });
        }
      });
    }
  };
};

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
            if (savedUser) {
              resolve(JSON.parse(savedUser));
            } else {
              resolve(null);
            }
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
    redirectToLogin: (url) => {
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
