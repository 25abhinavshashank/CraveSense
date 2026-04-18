const express = require('express');
const { analyzePattern, getDangerZone, getPatternStats } = require('../controllers/patternController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/analyze', analyzePattern);
router.get('/danger-zone', getDangerZone);
router.get('/stats', getPatternStats);

module.exports = router;
