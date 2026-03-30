const employeeNames = ["张伟", "李娜", "王强", "陈敏", "刘洋"];
const officeStartHour = 9;

const form = document.getElementById("attendance-form");
const employeeSelect = document.getElementById("employee");
const actionSelect = document.getElementById("action");
const noteInput = document.getElementById("note");
const recordsBody = document.getElementById("records-body");
const clearButton = document.getElementById("clear-records");

const totalCheckinsEl = document.getElementById("total-checkins");
const lateCountEl = document.getElementById("late-count");
const totalCheckoutsEl = document.getElementById("total-checkouts");

const storageKey = "attendance_records";
let records = loadRecords();

boot();

function boot() {
  renderEmployees();
  renderTable();
  renderStats();

  form.addEventListener("submit", onSubmitAttendance);
  clearButton.addEventListener("click", clearRecords);
}

function renderEmployees() {
  employeeSelect.innerHTML = employeeNames
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");
}

function onSubmitAttendance(event) {
  event.preventDefault();

  const now = new Date();
  const employee = employeeSelect.value;
  const action = actionSelect.value;
  const note = noteInput.value.trim();

  const record = {
    id: crypto.randomUUID(),
    employee,
    action,
    note,
    timeISO: now.toISOString(),
    day: formatDate(now),
    status: getStatus(action, now)
  };

  records = [record, ...records];
  persistRecords(records);

  noteInput.value = "";
  renderTable();
  renderStats();
}

function getStatus(action, dateObj) {
  if (action === "checkout") {
    return "正常";
  }

  const isLate = dateObj.getHours() >= officeStartHour;
  return isLate ? "迟到" : "正常";
}

function renderTable() {
  if (records.length === 0) {
    const emptyTemplate = document.getElementById("empty-row-template");
    recordsBody.replaceChildren(emptyTemplate.content.cloneNode(true));
    return;
  }

  recordsBody.innerHTML = records
    .map((record) => {
      const actionLabel = record.action === "checkin" ? "签到" : "签退";
      const timeLabel = formatDateTime(new Date(record.timeISO));

      return `<tr>
        <td>${timeLabel}</td>
        <td>${record.employee}</td>
        <td>${actionLabel}</td>
        <td>${record.status}</td>
        <td>${record.note || "-"}</td>
      </tr>`;
    })
    .join("");
}

function renderStats() {
  const today = formatDate(new Date());
  const todayRecords = records.filter((record) => record.day === today);

  const totalCheckins = todayRecords.filter((r) => r.action === "checkin").length;
  const totalCheckouts = todayRecords.filter((r) => r.action === "checkout").length;
  const lateCount = todayRecords.filter(
    (r) => r.action === "checkin" && r.status === "迟到"
  ).length;

  totalCheckinsEl.textContent = String(totalCheckins);
  totalCheckoutsEl.textContent = String(totalCheckouts);
  lateCountEl.textContent = String(lateCount);
}

function clearRecords() {
  records = [];
  persistRecords(records);
  renderTable();
  renderStats();
}

function loadRecords() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistRecords(nextRecords) {
  localStorage.setItem(storageKey, JSON.stringify(nextRecords));
}

function formatDate(dateObj) {
  return [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()]
    .map((item) => String(item).padStart(2, "0"))
    .join("-");
}

function formatDateTime(dateObj) {
  const dateText = formatDate(dateObj);
  const timeText = [dateObj.getHours(), dateObj.getMinutes(), dateObj.getSeconds()]
    .map((item) => String(item).padStart(2, "0"))
    .join(":");

  return `${dateText} ${timeText}`;
}
