const jwt = require('jsonwebtoken');
const User = require('../models/User');

function isSameCalendarDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

async function maybeResetDailyCalories(user) {
  const now = new Date();
  const lastReset = user.lastCalorieReset ? new Date(user.lastCalorieReset) : null;

  if (!lastReset || !isSameCalendarDay(lastReset, now)) {
    user.caloriesConsumedToday = 0;
    user.lastCalorieReset = now;
    await user.save();
  }

  return user;
}

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User session is no longer valid.' });
    }

    await maybeResetDailyCalories(user);
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired access token.' });
    }

    next(error);
  }
}

module.exports = {
  authMiddleware,
  maybeResetDailyCalories
};
