const express = require('express');
const { subscribe, triggerWarning } = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.post('/subscribe', subscribe);
router.post('/trigger-warning', triggerWarning);

module.exports = router;
