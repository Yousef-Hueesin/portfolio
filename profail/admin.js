import { auth, db, hasAdminAccess } from "./firebase.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const content = document.querySelector("[data-admin-content]");
const title = document.querySelector("[data-page-title]");
const subtitle = document.querySelector("[data-page-subtitle]");
const status = document.querySelector("[data-admin-status]");
const unreadCount = document.querySelector("[data-unread-count]");
let signedInUser = null;
let allMessages = [];
let allPosts = [];

function showStatus(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
  status.hidden = !message;
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatDate(value) {
  const date = value && typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function setViewHeading(heading, description) {
  title.textContent = heading;
  subtitle.textContent = description;
  showStatus("");
}

function makePanel(heading) {
  const panel = makeElement("section", "admin-panel");
  const panelHeading = makeElement("div", "panel-heading");
  panelHeading.append(makeElement("h2", "", heading));
  panel.append(panelHeading);
  const list = makeElement("div", "record-list");
  panel.append(list);
  return { panel, list };
}

function renderMessageRecord(message, allowActions = true) {
  const record = makeElement("article", `message-record${message.read ? "" : " is-unread"}`);
  const main = makeElement("div", "record-main");
  const sender = [message.firstName, message.lastName].filter(Boolean).join(" ") || "Website visitor";
  main.append(makeElement("h3", "record-title", sender));
  main.append(makeElement("p", "record-meta", [message.email, message.phone].filter(Boolean).join(" · ")));
  if (message.subject) main.append(makeElement("p", "record-meta", message.subject));
  main.append(makeElement("p", "record-copy", message.message || ""));
  main.append(makeElement("p", "record-date", formatDate(message.createdAt)));
  record.append(main);

  if (allowActions) {
    const actions = makeElement("div", "record-actions");
    if (!message.read) {
      const markRead = makeElement("button", "small-button", "Mark read");
      markRead.type = "button";
      markRead.addEventListener("click", () => updateMessage(message.id, { read: true }));
      actions.append(markRead);
    }
    const remove = makeElement("button", "small-button is-danger", "Delete");
    remove.type = "button";
    remove.addEventListener("click", () => deleteMessage(message.id));
    actions.append(remove);
    record.append(actions);
  }
  return record;
}

function showEmpty(list, message) {
  list.append(makeElement("p", "empty-state", message));
}

function renderOverview() {
  setViewHeading("Overview", "A clear view of your website activity.");
  content.replaceChildren();
  const stats = makeElement("section", "stats-grid");
  [
    ["Total messages", allMessages.length],
    ["Unread messages", allMessages.filter((message) => !message.read).length],
    ["Published articles", allPosts.filter((post) => post.published).length],
  ].forEach(([label, value]) => {
    const card = makeElement("article", "stat-card");
    card.append(makeElement("p", "", label), makeElement("strong", "", String(value)));
    stats.append(card);
  });
  content.append(stats);

  const { panel, list } = makePanel("Recent messages");
  allMessages.slice(0, 4).forEach((message) => list.append(renderMessageRecord(message, false)));
  if (!allMessages.length) showEmpty(list, "Messages sent through your website will appear here.");
  content.append(panel);
}

function makeField(labelText, name, value = "", multiline = false, required = false) {
  const label = makeElement("label", "field-label", labelText);
  const field = document.createElement(multiline ? "textarea" : "input");
  field.name = name;
  field.value = value;
  if (!multiline) field.type = "text";
  field.required = required;
  label.append(field);
  return label;
}

function renderPostRecord(post, list, form) {
  const record = makeElement("article", "post-record");
  const main = makeElement("div", "record-main");
  main.append(makeElement("h3", "record-title", post.title || "Untitled article"));
  main.append(makeElement("p", "record-meta", `${post.category || "Uncategorized"} · ${post.published ? "Published" : "Draft"}`));
  main.append(makeElement("p", "record-copy", post.excerpt || ""));
  main.append(makeElement("p", "record-date", formatDate(post.createdAt)));
  record.append(main);

  const actions = makeElement("div", "record-actions");
  const edit = makeElement("button", "small-button", "Edit");
  edit.type = "button";
  edit.addEventListener("click", () => {
    form.elements.title.value = post.title || "";
    form.elements.category.value = post.category || "";
    form.elements.excerpt.value = post.excerpt || "";
    form.elements.content.value = post.content || "";
    form.elements.published.checked = Boolean(post.published);
    form.dataset.editingId = post.id;
    form.querySelector("[data-save-post]").textContent = "Save changes";
    form.querySelector("[data-cancel-edit]").hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  actions.append(edit);

  const publish = makeElement("button", "small-button", post.published ? "Unpublish" : "Publish");
  publish.type = "button";
  publish.addEventListener("click", () => updatePost(post.id, { published: !post.published }));
  actions.append(publish);

  const remove = makeElement("button", "small-button is-danger", "Delete");
  remove.type = "button";
  remove.addEventListener("click", () => deletePost(post.id));
  actions.append(remove);
  record.append(actions);
  list.append(record);
}

function renderBlog() {
  setViewHeading("Blog", "Write, edit, and publish articles on your website.");
  content.replaceChildren();
  const layout = makeElement("div", "blog-admin-grid");
  const editor = makeElement("section", "admin-panel");
  editor.append(makeElement("div", "panel-heading", "Article editor"));
  const form = makeElement("form", "post-form");
  form.append(
    makeField("Title", "title", "", false, true),
    makeField("Category", "category", "", false, true),
    makeField("Short introduction", "excerpt", "", true, true),
    makeField("Article body", "content", "", true, true),
  );
  const publishLabel = makeElement("label", "publish-toggle");
  const publishCheckbox = document.createElement("input");
  publishCheckbox.type = "checkbox";
  publishCheckbox.name = "published";
  publishLabel.append(publishCheckbox, document.createTextNode("Publish on website"));
  form.append(publishLabel);
  const formActions = makeElement("div", "form-actions");
  const save = makeElement("button", "primary-button", "Save article");
  save.type = "submit";
  save.dataset.savePost = "";
  const cancel = makeElement("button", "secondary-button", "Cancel edit");
  cancel.type = "button";
  cancel.dataset.cancelEdit = "";
  cancel.hidden = true;
  cancel.addEventListener("click", () => resetPostForm(form));
  formActions.append(save, cancel);
  form.append(formActions);
  form.addEventListener("submit", savePost);
  editor.append(form);
  layout.append(editor);

  const listing = makeElement("section", "admin-panel");
  listing.append(makeElement("div", "panel-heading", "All articles"));
  const list = makeElement("div", "record-list");
  allPosts.forEach((post) => renderPostRecord(post, list, form));
  if (!allPosts.length) showEmpty(list, "Your first article can start here.");
  listing.append(list);
  layout.append(listing);
  content.append(layout);
}

function resetPostForm(form) {
  form.reset();
  delete form.dataset.editingId;
  form.querySelector("[data-save-post]").textContent = "Save article";
  form.querySelector("[data-cancel-edit]").hidden = true;
}

async function savePost(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const postData = {
    title: String(formData.get("title") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    excerpt: String(formData.get("excerpt") || "").trim(),
    content: String(formData.get("content") || "").trim(),
    published: formData.has("published"),
    updatedAt: serverTimestamp(),
  };
  const editingId = form.dataset.editingId;
  showStatus("Saving article...");
  try {
    if (editingId) {
      await updateDoc(doc(db, "posts", editingId), postData);
    } else {
      await addDoc(collection(db, "posts"), { ...postData, createdAt: serverTimestamp() });
    }
    resetPostForm(form);
    await refreshRecords();
    renderBlog();
    showStatus("Article saved.");
  } catch {
    showStatus("The article could not be saved. Check your connection and Firestore rules.", "error");
  }
}

async function updateMessage(id, updates) {
  try {
    await updateDoc(doc(db, "messages", id), updates);
    await refreshRecords();
    renderMessages();
  } catch {
    showStatus("The message could not be updated.", "error");
  }
}

async function deleteMessage(id) {
  if (!window.confirm("Delete this message permanently?")) return;
  try {
    await deleteDoc(doc(db, "messages", id));
    await refreshRecords();
    renderMessages();
    showStatus("Message deleted.");
  } catch {
    showStatus("The message could not be deleted.", "error");
  }
}

async function updatePost(id, updates) {
  try {
    await updateDoc(doc(db, "posts", id), { ...updates, updatedAt: serverTimestamp() });
    await refreshRecords();
    renderBlog();
    showStatus("Article updated.");
  } catch {
    showStatus("The article could not be updated.", "error");
  }
}

async function deletePost(id) {
  if (!window.confirm("Delete this article permanently?")) return;
  try {
    await deleteDoc(doc(db, "posts", id));
    await refreshRecords();
    renderBlog();
    showStatus("Article deleted.");
  } catch {
    showStatus("The article could not be deleted.", "error");
  }
}

function renderMessages() {
  setViewHeading("Messages", "Messages sent through your website contact form.");
  content.replaceChildren();
  const { panel, list } = makePanel("Inbox");
  allMessages.forEach((message) => list.append(renderMessageRecord(message)));
  if (!allMessages.length) showEmpty(list, "No messages yet. New contact form submissions will appear here.");
  content.append(panel);
}

async function refreshRecords() {
  const [messageSnapshot, postSnapshot] = await Promise.all([
    getDocs(collection(db, "messages")),
    getDocs(collection(db, "posts")),
  ]);
  allMessages = messageSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  allMessages.sort((first, second) => new Date(second.createdAt?.toDate?.() || 0) - new Date(first.createdAt?.toDate?.() || 0));
  allPosts = postSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  allPosts.sort((first, second) => new Date(second.createdAt?.toDate?.() || 0) - new Date(first.createdAt?.toDate?.() || 0));
  unreadCount.textContent = String(allMessages.filter((message) => !message.read).length);
}

async function openView(view) {
  document.querySelectorAll("[data-admin-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminView === view);
  });
  content.replaceChildren(makeElement("p", "loading-state", "Loading your workspace..."));
  try {
    await refreshRecords();
    if (view === "blog") renderBlog();
    else if (view === "messages") renderMessages();
    else renderOverview();
  } catch {
    content.replaceChildren();
    showStatus("Could not load your Firestore data. Check that Firestore is enabled and the admin UID is allowlisted.", "error");
  }
}

document.querySelectorAll("[data-admin-view]").forEach((button) => {
  button.addEventListener("click", () => openView(button.dataset.adminView));
});

document.querySelector("[data-signout]").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }
  try {
    if (!(await hasAdminAccess(user))) {
      await signOut(auth);
      window.location.replace("login.html?access=denied");
      return;
    }
    signedInUser = user;
    document.querySelector("[data-admin-email]").textContent = signedInUser.email || "Admin";
    document.querySelector(".account-avatar").textContent = (signedInUser.email || "A").charAt(0).toUpperCase();
    openView("overview");
  } catch {
    showStatus("Admin access could not be verified. Check your Firestore rules and network connection.", "error");
  }
});