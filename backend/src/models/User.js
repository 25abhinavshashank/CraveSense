const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    dailyCalorieGoal: {
      type: Number,
      default: 1500,
      min: 500
    },
    dailyProteinGoal: {
      type: Number,
      default: 120,
      min: 0
    },
    dailyCarbGoal: {
      type: Number,
      default: 160,
      min: 0
    },
    dailyFatGoal: {
      type: Number,
      default: 50,
      min: 0
    },
    fitnessGoal: {
      type: String,
      enum: ['fat_loss', 'muscle_gain', 'maintain'],
      default: 'fat_loss'
    },
    caloriesConsumedToday: {
      type: Number,
      default: 0,
      min: 0
    },
    lastCalorieReset: {
      type: Date,
      default: Date.now
    },
    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    refreshToken: {
      type: String,
      default: ''
    },
    dietStartDate: {
      type: Date,
      default: Date.now
    },
    lastPatternInsight: {
      personalInsight: String,
      topRecommendation: String
    },
    lastInsightDate: {
      type: Date,
      default: null
    },
    lastWarnedAt: {
      type: Date,
      default: null
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const user = this.toObject({ versionKey: false });
  delete user.password;
  delete user.refreshToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
