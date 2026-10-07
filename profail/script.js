const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const loginButton = document.querySelector(".nav-login");

if (loginButton instanceof HTMLButtonElement) {
  loginButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
    mainNav.classList.toggle("is-open", !isExpanded);
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      mainNav.classList.remove("is-open");
    }
  });
}

document.querySelectorAll("[data-toggle-password]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.parentElement?.querySelector("input");
    if (!(input instanceof HTMLInputElement)) return;

    const shouldShow = input.type === "password";
    input.type = shouldShow ? "text" : "password";
    button.textContent = shouldShow ? "Hide" : "Show";
    button.setAttribute("aria-label", `${shouldShow ? "Hide" : "Show"} password`);
  });
});

const dashboardStorageKeys = {
  contactMessages: "rlead.contactMessages",
  signupUsers: "rlead.signupUsers",
};

function readDashboardRecords(key, fields) {
  let serializedRecords;
  try {
    serializedRecords = localStorage.getItem(key);
  } catch {
    throw new Error("Browser storage is unavailable. Check your browser privacy settings.");
  }

  if (serializedRecords === null) return [];

  let records;
  try {
    records = JSON.parse(serializedRecords);
  } catch {
    throw new Error("Saved dashboard data could not be read. Please check this browser's stored data.");
  }

  if (!Array.isArray(records) || records.some((record) =>
    !record || typeof record !== "object" || fields.some((field) => typeof record[field] !== "string")
  )) {
    throw new Error("Saved dashboard data has an unexpected format.");
  }

  return records;
}

function saveDashboardRecords(key, records) {
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch {
    throw new Error("Could not save this submission in your browser. Check available storage and try again.");
  }
}

function getFormValue(form, name) {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value.trim() : "";
}

function renderDashboard() {
  const dashboard = document.querySelector("[data-dashboard]");
  if (!dashboard) return;

  const messageList = dashboard.querySelector("[data-message-list]");
  const signupList = dashboard.querySelector("[data-signup-list]");
  const messageCounts = dashboard.querySelectorAll("[data-message-count]");
  const signupCounts = dashboard.querySelectorAll("[data-signup-count]");
  const status = dashboard.querySelector("[data-dashboard-status]");

  try {
    const messages = readDashboardRecords(dashboardStorageKeys.contactMessages, [
      "firstName", "lastName", "email", "phone", "subject", "message", "createdAt",
    ]);
    const users = readDashboardRecords(dashboardStorageKeys.signupUsers, ["name", "email", "createdAt"]);

    messageCounts.forEach((element) => {
      element.textContent = String(messages.length);
    });
    signupCounts.forEach((element) => {
      element.textContent = String(users.length);
    });
    status.textContent = "";
    status.hidden = true;
    renderDashboardList(messageList, messages, "message");
    renderDashboardList(signupList, users, "signup");
  } catch (error) {
    messageCounts.forEach((element) => {
      element.textContent = "—";
    });
    signupCounts.forEach((element) => {
      element.textContent = "—";
    });
    messageList.replaceChildren();
    signupList.replaceChildren();
    status.textContent = error instanceof Error ? error.message : "Dashboard data could not be loaded.";
    status.hidden = false;
  }
}

function appendDashboardText(parent, className, text) {
  const element = document.createElement("p");
  element.className = className;
  element.textContent = text;
  parent.append(element);
}

function appendDashboardDate(parent, dateValue) {
  const element = document.createElement("time");
  const date = new Date(dateValue);
  element.className = "dashboard-record-date";
  if (!Number.isNaN(date.getTime())) {
    element.dateTime = date.toISOString();
    element.textContent = date.toLocaleString();
  } else {
    element.textContent = "Date unavailable";
  }
  parent.append(element);
}

function renderDashboardList(container, records, type) {
  container.replaceChildren();
  const sortedRecords = [...records].sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt)
  );

  if (sortedRecords.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "dashboard-empty";
    emptyState.textContent = type === "message"
      ? "No contact messages yet."
      : "No signups yet.";
    container.append(emptyState);
    return;
  }

  sortedRecords.forEach((record) => {
    const card = document.createElement("article");
    card.className = "dashboard-record";

    if (type === "message") {
      const senderName = [record.firstName, record.lastName].filter(Boolean).join(" ");
      appendDashboardText(card, "dashboard-record-title", senderName || "New message");
      appendDashboardText(card, "dashboard-record-meta", record.email);
      if (record.subject) appendDashboardText(card, "dashboard-record-subject", record.subject);
      appendDashboardText(card, "dashboard-record-message", record.message);
      if (record.phone) appendDashboardText(card, "dashboard-record-meta", record.phone);
    } else {
      appendDashboardText(card, "dashboard-record-title", record.name);
      appendDashboardText(card, "dashboard-record-meta", record.email);
    }

    appendDashboardDate(card, record.createdAt);
    container.append(card);
  });
}

document.querySelectorAll("[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    if (!status) return;

    const formType = form.getAttribute("data-demo-form");
    try {
      if (formType === "contact") {
        const message = getFormValue(form, "message");
        const email = getFormValue(form, "email");
        if (!message || !email) {
          status.textContent = "Please enter your email address and a message.";
          return;
        }

        const messages = readDashboardRecords(dashboardStorageKeys.contactMessages, [
          "firstName", "lastName", "email", "phone", "subject", "message", "createdAt",
        ]);
        messages.push({
          firstName: getFormValue(form, "first-name"),
          lastName: getFormValue(form, "last-name"),
          email,
          phone: getFormValue(form, "phone"),
          subject: getFormValue(form, "subject"),
          message,
          createdAt: new Date().toISOString(),
        });
        saveDashboardRecords(dashboardStorageKeys.contactMessages, messages);
        status.textContent = "Message saved on this device. It has not been sent to a server.";
        form.reset();
      } else if (formType === "signup") {
        const name = getFormValue(form, "name");
        const email = getFormValue(form, "email").toLowerCase();
        const users = readDashboardRecords(dashboardStorageKeys.signupUsers, ["name", "email", "createdAt"]);
        if (users.some((user) => user.email.toLowerCase() === email)) {
          status.textContent = "This email is already on the signup list in this browser.";
          return;
        }

        users.push({ name, email, createdAt: new Date().toISOString() });
        saveDashboardRecords(dashboardStorageKeys.signupUsers, users);
        status.textContent = "Signup saved on this device (demo only). No password was stored.";
        form.reset();
      } else {
        status.textContent = "This is a front-end demo. Connect a secure authentication service to continue.";
      }
      renderDashboard();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "The submission could not be saved.";
    }
  });
});

renderDashboard();
window.addEventListener("storage", (event) => {
  if (Object.values(dashboardStorageKeys).includes(event.key)) renderDashboard();
});

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const revealTargets = document.querySelectorAll("main > section");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealTargets.forEach((section) => section.classList.add("reveal"));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  revealTargets.forEach((section) => revealObserver.observe(section));
}
