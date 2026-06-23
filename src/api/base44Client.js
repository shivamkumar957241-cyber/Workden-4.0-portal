import { auth, db } from './firebaseConfig';
import { 
  collection, getDocs, query, where, addDoc, updateDoc, doc, onSnapshot, orderBy, deleteDoc
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signOut, updateProfile
} from 'firebase/auth';

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
      const snapshot = await getDocs(q);
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
      const snapshot = await getDocs(q);
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
      return onSnapshot(colRef, (snapshot) => {
        const events = snapshot.docChanges().map(change => ({
          type: change.type,
          payload: { id: change.doc.id, ...change.doc.data() }
        }));
        events.forEach(event => callback(event));
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
            const savedUser = localStorage.getItem('workden_user');
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
