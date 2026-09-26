const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other'
];

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide an expense title'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an expense amount'],
      min: [0.01, 'Amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid category'
      }
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: Date,
      required: [true, 'Please provide an expense date'],
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
