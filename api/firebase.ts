import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDocs,
  collection,
  setDoc,
  query,
  where,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0352587537",
  appId: "1:30797462564:web:4a2f751b011942dfb26cb1",
  apiKey: "AIzaSyAm7Fnv8XZ7VRMCsqzzEEeXtHXRo4QTzRI",
  authDomain: "gen-lang-client-0352587537.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-7c17152c-fdc1-4b05-9ef6-0782f45eb039",
  storageBucket: "gen-lang-client-0352587537.firebasestorage.app",
  messagingSenderId: "30797462564",
  measurementId: "",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const SERVER_SECRET = "pollars-royale-v1";

export interface UserData {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  pollars: number;
  rebirths: number;
  serverSecret?: string;
  createdAt?: string;
}

export const MockDynamoDB = {
  async getUser(username: string): Promise<UserData | null> {
    try {
      const usersRef = collection(db, "users");
      const q1 = query(usersRef, where("username", "==", username));
      const q1Snap = await getDocs(q1);
      if (!q1Snap.empty)
        return { id: q1Snap.docs[0].id, ...q1Snap.docs[0].data() } as UserData;

      const q2 = query(usersRef, where("email", "==", username));
      const q2Snap = await getDocs(q2);
      if (!q2Snap.empty)
        return { id: q2Snap.docs[0].id, ...q2Snap.docs[0].data() } as UserData;

      return null;
    } catch (e) {
      console.error("Firestore GetUser Error:", e);
      return null;
    }
  },

  async createUser(user: UserData) {
    const { id, ...userData } = user;
    await setDoc(doc(db, "users", id), {
      ...userData,
      serverSecret: SERVER_SECRET,
      createdAt: new Date().toISOString(),
    });
    return user;
  },

  async updateUser(
    username: string,
    updates: Partial<UserData>,
  ): Promise<UserData | null> {
    const user = await this.getUser(username);
    if (!user) return null;

    const safeUpdates = { ...updates, serverSecret: SERVER_SECRET };
    await updateDoc(doc(db, "users", user.id), safeUpdates);

    return { ...user, ...updates };
  },

  async getTop10Users() {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("pollars", "desc"), limit(10));
      const snap = await getDocs(q);

      return snap.docs.map((docSnap) => ({
        username: docSnap.data().username,
        pollars: docSnap.data().pollars,
        rebirths: docSnap.data().rebirths,
      }));
    } catch (e) {
      console.error("Firestore Leaderboard Error:", e);
      return [];
    }
  },
};
