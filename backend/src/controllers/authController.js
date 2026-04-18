const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/sendPasswordResetEmail');
const { maybeResetDailyCalories } = require('../middleware/authMiddleware');
const { calculateDietDay } = require('../services/patternService');

const REFRESH_COOKIE_NAME = 'refreshToken';

function createAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function createRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

function buildUserPayload(user) {
  const safeUser = user.toSafeObject ? user.toSafeObject() : user.toObject({ versionKey: false });
  return {
    ...safeUser,
    dietStreak: calculateDietDay(user)
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, dailyCalorieGoal, dailyProteinGoal, dailyCarbGoal, dailyFatGoal, fitnessGoal } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      dailyCalorieGoal: dailyCalorieGoal || undefined,
      dailyProteinGoal: dailyProteinGoal || undefined,
      dailyCarbGoal: dailyCarbGoal || undefined,
      dailyFatGoal: dailyFatGoal || undefined,
      fitnessGoal: fitnessGoal || undefined
    });

    const refreshToken = createRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    const accessToken = createAccessToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      message: 'Registered successfully.',
      accessToken,
      user: buildUserPayload(user)
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    await maybeResetDailyCalories(user);
    const refreshToken = createRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    const accessToken = createAccessToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({
      message: 'Logged in successfully.',
      accessToken,
      user: buildUserPayload(user)
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = '';
        await user.save();
      }
    }

    clearRefreshCookie(res);
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: decoded.id, refreshToken });

    if (!user) {
      return res.status(403).json({ message: 'Refresh token is invalid.' });
    }

    await maybeResetDailyCalories(user);
    const accessToken = createAccessToken(user._id);

    res.json({
      accessToken,
      user: buildUserPayload(user)
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Refresh token expired.' });
    }
    next(error);
  }
}

const FORGOT_PASSWORD_RESPONSE = {
  message: 'If an account exists for that email, you will receive password reset instructions shortly.'
};

async function forgotPassword(req, res, next) {
  try {
    const rawEmail = req.body.email?.trim();
    if (!rawEmail) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const email = rawEmail.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.json(FORGOT_PASSWORD_RESPONSE);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetToken = hashed;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendPasswordResetEmail({ to: user.email, resetUrl });
    } catch (mailError) {
      console.error('Password reset email failed:', mailError.message);
    }

    res.json(FORGOT_PASSWORD_RESPONSE);
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({ message: 'Email, reset token, and new password are required.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired. Request a new one.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = '';
    await user.save();

    res.json({ message: 'Password updated. You can log in with your new password.' });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    res.json({ user: buildUserPayload(req.user) });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const allowedUpdates = [
      'name',
      'dailyCalorieGoal',
      'dailyProteinGoal',
      'dailyCarbGoal',
      'dailyFatGoal',
      'fitnessGoal'
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    await req.user.save();

    res.json({
      message: 'Profile updated successfully.',
      user: buildUserPayload(req.user)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resetPassword,
  updateProfile
};
