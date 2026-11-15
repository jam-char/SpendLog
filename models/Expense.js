const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  description: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, required: true, trim: true, maxlength: 50 },
  amount: { type: Number, required: true, min: 0.01 },
});

module.exports = mongoose.model("Expense", expenseSchema);
