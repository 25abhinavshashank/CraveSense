const webPush = require('web-push');
const User = require('../models/User');
const { getDangerZoneSummary } = require('../services/patternService');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webPush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

function hasRecentWarning(lastWarnedAt) {
  if (!lastWarnedAt) {
    return false;
  }

  return Date.now() - new Date(lastWarnedAt).getTime() < 6 * 60 * 60 * 1000;
}

async function sendNotificationToUser(user, payload) {
  if (!user.pushSubscription) {
    return false;
  }

  try {
    await webPush.sendNotification(user.pushSubscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      user.pushSubscription = null;
      await user.save();
      return false;
    }

    throw error;
  }
}

async function subscribe(req, res, next) {
  try {
    req.user.pushSubscription = req.body;
    await req.user.save();

    res.json({ message: 'Push subscription saved successfully.' });
  } catch (error) {
    next(error);
  }
}

async function triggerWarning(req, res, next) {
  try {
    if (!req.user.pushSubscription) {
      return res.status(400).json({ message: 'No push subscription found for this user.' });
    }

    const summary = await getDangerZoneSummary(req.user._id);
    const payload = {
      title: 'CraveSense Warning',
      body:
        summary.warningMessage ||
        `It's ${summary.currentHourLabel}. Your data says this is your danger zone. Stay strong!`,
      url: process.env.CLIENT_URL || 'http://localhost:5173/dashboard'
    };

    await sendNotificationToUser(req.user, payload);
    req.user.lastWarnedAt = new Date();
    await req.user.save();

    res.json({ message: 'Test warning notification sent.', payload });
  } catch (error) {
    next(error);
  }
}

async function triggerDangerZoneWarningsJob() {
  const users = await User.find({ pushSubscription: { $ne: null } });

  for (const user of users) {
    try {
      const summary = await getDangerZoneSummary(user._id);
      if (!summary.currentHourInDangerZone || hasRecentWarning(user.lastWarnedAt)) {
        continue;
      }

      const sent = await sendNotificationToUser(user, {
        title: 'CraveSense Warning',
        body: `It's ${summary.currentHourLabel}. Your data says this is your danger zone. Stay strong!`,
        url: process.env.CLIENT_URL || 'http://localhost:5173/dashboard'
      });

      if (sent) {
        user.lastWarnedAt = new Date();
        await user.save();
      }
    } catch (error) {
      console.error(`Danger zone notification failed for user ${user._id}:`, error.message);
    }
  }
}

module.exports = {
  subscribe,
  triggerDangerZoneWarningsJob,
  triggerWarning
};
