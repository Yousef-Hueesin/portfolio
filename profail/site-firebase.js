import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

function dateFromValue(value) {
  if (value && typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderBlogPost(post) {
  const article = document.createElement("article");
  article.className = "blog-card";
  const date = dateFromValue(post.createdAt);
  const meta = document.createElement("p");
  meta.className = "blog-meta";
  meta.textContent = [post.category || "NOTES", date ? date.toLocaleDateString() : ""].filter(Boolean).join(" · ").toUpperCase();
  article.append(meta);
  addText(article, "h3", "", post.title || "Untitled article");
  addText(article, "p", "", post.excerpt || "");

  const details = document.createElement("details");
  details.className = "blog-article";
  addText(details, "summary", "", "Read article");
  const body = document.createElement("div");
  body.className = "blog-article-copy";
  (post.content || "").split(/\n\s*\n/).filter(Boolean).forEach((paragraph) => {
    addText(body, "p", "", paragraph);
  });
  details.append(body);
  article.append(details);
  return article;
}

const blogList = document.querySelector("[data-blog-list]");
if (blogList) {
  try {
    const snapshot = await getDocs(query(collection(db, "posts"), where("published", "==", true)));
    const posts = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    posts.sort((first, second) => (dateFromValue(second.createdAt)?.getTime() || 0) - (dateFromValue(first.createdAt)?.getTime() || 0));
    blogList.replaceChildren();
    if (posts.length) {
      posts.forEach((post) => blogList.append(renderBlogPost(post)));
    } else {
      addText(blogList, "p", "blog-loading", "No articles have been published yet.");
    }
  } catch {
    blogList.replaceChildren();
    addText(blogList, "p", "blog-loading", "Articles are temporarily unavailable.");
  }
}

const contactForm = document.querySelector("[data-firebase-contact]");
if (contactForm instanceof HTMLFormElement) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = contactForm.querySelector(".form-status");
    const submitButton = contactForm.querySelector("button[type='submit']");
    if (!status || !(submitButton instanceof HTMLButtonElement)) return;

    const formData = new FormData(contactForm);
    const message = String(formData.get("message") || "").trim();
    const email = String(formData.get("email") || "").trim();
    if (!email || !message) {
      status.textContent = "Please enter your email address and a message.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "Sending your message...";
    try {
      await addDoc(collection(db, "messages"), {
        firstName: String(formData.get("first-name") || "").trim(),
        lastName: String(formData.get("last-name") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        subject: String(formData.get("subject") || "").trim(),
        email,
        message,
        read: false,
        createdAt: serverTimestamp(),
      });
      contactForm.reset();
      status.textContent = "Your message was sent. Thank you for getting in touch.";
    } catch {
      status.textContent = "Your message could not be sent. Please try again later.";
    } finally {
      submitButton.disabled = false;
    }
  });
}