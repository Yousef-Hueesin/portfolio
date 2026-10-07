import { auth, hasAdminAccess } from "./firebase.js";
import { onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const form = document.querySelector("[data-admin-login]");
const status = form?.querySelector(".form-status");
let isSubmitting = false;

function getSignInErrorMessage(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email or password is incorrect.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is disabled. Enable it in Firebase Authentication settings.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Wait a while, then try again.";
    case "auth/network-request-failed":
      return "Firebase could not be reached. Check your internet connection and try again.";
    case "auth/invalid-api-key":
      return "Firebase rejected the API key. Check the web app configuration in firebase.js.";
    default:
      return error?.code
        ? `Sign-in failed (${error.code}). Check Firebase Authentication settings and try again.`
        : "Sign-in failed. Check your Firebase Authentication settings and try again.";
  }
}

if (form instanceof HTMLFormElement && status) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    if (!(submitButton instanceof HTMLButtonElement)) return;

    isSubmitting = true;
    submitButton.disabled = true;
    status.textContent = "Signing in...";
    let user;
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      user = credential.user;
    } catch (error) {
      status.textContent = getSignInErrorMessage(error);
      isSubmitting = false;
      submitButton.disabled = false;
      return;
    }

    try {
      if (user.email?.toLowerCase() === "yhussin757@gmail.com" && !user.emailVerified) {
        await sendEmailVerification(user);
        await signOut(auth);
        status.textContent = "Check your inbox for an email verification link, then sign in again.";
        return;
      }
      if (!(await hasAdminAccess(user))) {
        await signOut(auth);
        status.textContent = "This account is signed in but is not allowlisted as an admin.";
        return;
      }
      window.location.href = "admin.html";
    } catch (error) {
      status.textContent = error?.code === "permission-denied"
        ? "Sign-in worked, but Firestore denied the admin check. Publish the rules in firestore.rules."
        : `Sign-in worked, but admin access could not be verified${error?.code ? ` (${error.code})` : ""}. Check Firestore setup and rules.`;
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
    }
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user || isSubmitting) return;
    try {
      if (await hasAdminAccess(user)) window.location.replace("admin.html");
      else await signOut(auth);
    } catch {
      status.textContent = "Admin access could not be verified. Check Firestore rules.";
    }
  });
}