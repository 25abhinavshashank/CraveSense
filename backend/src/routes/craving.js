const express = require('express');
const { getAIResponse, getHistory, getTodayCravings, logCraving } = require('../controllers/cravingController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/ai-response', getAIResponse);

router.use(authMiddleware);
router.post('/log', logCraving);
router.get('/today', getTodayCravings);
router.get('/history', getHistory);

module.exports = router;
