import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const form = document.querySelector("[data-firebase-signup]");
const status = form?.querySelector(".form-status");

if (form instanceof HTMLFormElement && status) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    if (!(submitButton instanceof HTMLButtonElement)) return;

    submitButton.disabled = true;
    status.textContent = "Creating your account...";
    let createdUser = null;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = credential.user;
      if (name) await updateProfile(createdUser, { displayName: name });
      await sendEmailVerification(createdUser);
      await signOut(auth);
      form.reset();
      status.textContent = "Account created. Check your inbox for a verification link, then sign in.";
    } catch (error) {
      if (createdUser) {
        await signOut(auth).catch(() => {});
        status.textContent = "Your account was created, but we could not send the verification email. Try again later.";
      } else if (error?.code === "auth/email-already-in-use") {
        status.textContent = "An account with this email already exists. Try signing in.";
      } else if (error?.code === "auth/weak-password") {
        status.textContent = "Choose a stronger password with at least 8 characters.";
      } else if (error?.code === "auth/invalid-email") {
        status.textContent = "Enter a valid email address.";
      } else if (error?.code === "auth/operation-not-allowed") {
        status.textContent = "Email/password signup is not enabled in Firebase Authentication.";
      } else {
        status.textContent = "Could not create your account. Check your connection and try again.";
      }
    } finally {
      submitButton.disabled = false;
    }
  });
}