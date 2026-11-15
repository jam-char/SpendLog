const form = document.getElementById("expense-form");
const tbody = document.getElementById("expense-body");
const message = document.getElementById("message");

// Formats numbers as Philippine pesos, e.g. ₱120.00
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

// Get all expenses from the API and fill the table
async function loadExpenses() {
  const res = await fetch("/api/expenses");
  const expenses = await res.json();

  tbody.innerHTML = "";
  for (const e of expenses) {
    const tr = document.createElement("tr");
    for (const text of [
      e.date,
      e.description,
      e.category,
      peso.format(e.amount),
    ]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

// When the form is submitted, send the expense to the API
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page from reloading
  message.textContent = "";

  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: document.getElementById("date").value,
      description: document.getElementById("description").value,
      category: document.getElementById("category").value,
      amount: document.getElementById("amount").value,
    }),
  });

  if (res.ok) {
    form.reset();
    loadExpenses(); // refresh the table
  } else {
    const data = await res.json();
    message.textContent = data.error;
  }
});
const filterForm = document.getElementById("filter-form");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");
const rangeMessage = document.getElementById("range-message");

// Fill one report table. rows come from the API as { _id, total }.
function fillReport(tbodyId, rows) {
  const body = document.getElementById(tbodyId);
  body.innerHTML = "";

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 2;
    td.textContent = "No expenses in this range.";
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    for (const text of [row._id, peso.format(row.total)]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }
    body.appendChild(tr);
  }
}

async function loadReports() {
  rangeMessage.textContent = "";

  const params = new URLSearchParams();
  if (startInput.value) params.set("start", startInput.value);
  if (endInput.value) params.set("end", endInput.value);

  const res = await fetch("/api/reports?" + params.toString());
  const data = await res.json();

  if (!res.ok) {
    rangeMessage.textContent = data.error;
    return;
  }

  fillReport("category-body", data.category);
  fillReport("daily-body", data.daily);
  fillReport("monthly-body", data.monthly);
}

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadReports();
});

document.getElementById("clear-filter").addEventListener("click", () => {
  startInput.value = "";
  endInput.value = "";
  loadReports();
});

loadExpenses(); // load the table when the page opens
