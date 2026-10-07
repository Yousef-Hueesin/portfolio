import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAX-EDk_QYV_xfFz-E18gB9OuoARx-iQ8s",
  authDomain: "myproject-a3b32.firebaseapp.com",
  projectId: "myproject-a3b32",
  storageBucket: "myproject-a3b32.firebasestorage.app",
  messagingSenderId: "704454970163",
  appId: "1:704454970163:web:f2fc8e166aae54914e0c46",
  measurementId: "G-WWDR6NRCE8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

const adminEmails = new Set(["yhussin757@gmail.com"]);

export async function hasAdminAccess(user) {
  if (!user) return false;
  if (user.emailVerified && adminEmails.has(user.email?.toLowerCase())) return true;
  const adminRecord = await getDoc(doc(db, "admins", user.uid));
  return adminRecord.exists();
}