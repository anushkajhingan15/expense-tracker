const Expense = require('../models/Expense');

/**
 * @desc    Create new expense
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, description, date } = req.body;

    if (!title || amount === undefined || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, amount, category, and date'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const expense = await Expense.create({
      userId: req.user.id,
      title,
      amount: Number(amount),
      category,
      description: description || '',
      date: new Date(date)
    });

    return res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all expenses for logged-in user with filtering & sorting
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = async (req, res, next) => {
  try {
    const { category, search, startDate, endDate, sortBy = 'date', order = 'desc' } = req.query;

    // Strict user scoping
    const query = { userId: req.user.id };

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search filter (regex search on title or description)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end of day for inclusive end date search
        const eod = new Date(endDate);
        eod.setHours(23, 59, 59, 999);
        query.date.$lte = eod;
      }
    }

    // Sorting
    const sortField = sortBy === 'amount' ? 'amount' : 'date';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortField] = sortOrder;
    // Secondary sort tiebreaker by _id
    sortOptions._id = -1;

    const expenses = await Expense.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single expense by ID
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Strict ownership verification
    if (expense.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to access this expense'
      });
    }

    return res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update expense by ID
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Strict ownership verification
    if (expense.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to update this expense'
      });
    }

    const { title, amount, category, description, date } = req.body;

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (amount !== undefined) updateFields.amount = Number(amount);
    if (category !== undefined) updateFields.category = category;
    if (description !== undefined) updateFields.description = description;
    if (date !== undefined) updateFields.date = new Date(date);

    expense = await Expense.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete expense by ID
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Strict ownership verification
    if (expense.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to delete this expense'
      });
    }

    await expense.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get summary statistics for logged-in user
 * @route   GET /api/expenses/summary
 * @access  Private
 */
const getExpenseSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expenses = await Expense.find({ userId });

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const count = expenses.length;

    // Current Month Spending
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthSpending = expenses
      .filter((exp) => {
        const d = new Date(exp.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Highest Expense
    const highestExpense = expenses.length > 0
      ? Math.max(...expenses.map((exp) => exp.amount))
      : 0;

    // Category Breakdown
    const categoryBreakdown = {};
    expenses.forEach((exp) => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = { total: 0, count: 0 };
      }
      categoryBreakdown[exp.category].total += exp.amount;
      categoryBreakdown[exp.category].count += 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalExpenses,
        count,
        currentMonthSpending,
        highestExpense,
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};
