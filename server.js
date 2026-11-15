require("dotenv").config(); // 1. load the .env file (which package?)

const express = require("express");
const mongoose = require("mongoose"); // 2. import mongoose

const app = express();
const PORT = process.env.PORT || 3000;

const Expense = require("./models/Expense");

app.use(express.json()); // lets the server read JSON sent by the page

app.use(express.static("public"));

// List all expenses, newest first
app.get("/api/expenses", async (req, res) => {
  const expenses = await Expense.find().sort({ date: -1, _id: -1 });
  res.json(expenses);
});

// Add one expense
app.post("/api/expenses", async (req, res) => {
  try {
    const expense = await Expense.create({
      date: req.body.date,
      description: req.body.description,
      category: req.body.category,
      amount: req.body.amount,
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Reports: totals by category, by day and by month, with an optional date range
app.get("/api/reports", async (req, res) => {
  const { start, end } = req.query;

  if (start && end && start > end) {
    return res
      .status(400)
      .json({ error: "Start date must be on or before end date." });
  }

  // Build the filter. Both start and end dates are included.
  const dateFilter = {};
  if (start) dateFilter.$gte = start;
  if (end) dateFilter.$lte = end;
  const match = Object.keys(dateFilter).length ? { date: dateFilter } : {};

  const [category, daily, monthly] = await Promise.all([
    Expense.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: match },
      { $group: { _id: "$date", total: { $sum: "$amount" } } },
      { $sort: { _id: -1 } },
    ]),
    Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $substr: ["$date", 0, 7] },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: -1 } },
    ]),
  ]);

  res.json({ category, daily, monthly });
});
// 3. connect, then start the server only if it worked
mongoose
  .connect(process.env.MONGODB_URI) // the name you used in .env
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });
