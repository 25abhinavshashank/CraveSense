const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    why: {
      type: String,
      required: true
    },
    taste: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const cravingLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  dayOfWeek: {
    type: String,
    default: ''
  },
  hourOfDay: {
    type: Number,
    min: 0,
    max: 23
  },
  dietDay: {
    type: Number,
    default: 1,
    min: 1
  },
  hungerType: {
    type: String,
    enum: ['real_hunger', 'craving'],
    default: 'craving'
  },
  tasteType: {
    type: String,
    enum: ['sweet', 'salty', 'oily', 'spicy', 'specific'],
    default: 'specific'
  },
  specificFood: {
    type: String,
    default: '',
    trim: true
  },
  trigger: {
    type: String,
    enum: ['bored', 'stressed', 'habit', 'saw_food', 'social', 'tired', 'other'],
    default: 'other'
  },
  intensity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  challengeGiven: {
    type: String,
    default: ''
  },
  challengeCompleted: {
    type: Boolean,
    default: false
  },
  outcome: {
    type: String,
    enum: ['resisted', 'gave_in', 'ate_healthy_swap', 'completed_challenge'],
    default: 'gave_in'
  },
  caloriesConsumed: {
    type: Number,
    default: 0,
    min: 0
  },
  foodEaten: {
    type: String,
    default: '',
    trim: true
  },
  aiMotivation: {
    type: String,
    default: ''
  },
  aiSuggestions: {
    type: [suggestionSchema],
    default: []
  }
});

cravingLogSchema.pre('validate', function setTimeMetadata(next) {
  const eventTime = this.timestamp ? new Date(this.timestamp) : new Date();
  this.timestamp = eventTime;

  if (!this.dayOfWeek) {
    this.dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(eventTime);
  }
  
  if (this.hourOfDay === undefined || this.hourOfDay === null) {
    this.hourOfDay = eventTime.getHours();
  }
  
  next();
});

cravingLogSchema.index({ userId: 1, timestamp: -1 });
cravingLogSchema.index({ userId: 1, hourOfDay: 1 });

module.exports = mongoose.model('CravingLog', cravingLogSchema);
