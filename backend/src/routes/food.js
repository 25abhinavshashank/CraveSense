const express = require('express');
const {
  deleteFoodLog,
  getFoodSummary,
  getTodayFood,
  logFood,
  searchFood,
  updateFoodLog
} = require('../controllers/foodController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/search', searchFood);
router.post('/log', logFood);
router.get('/today', getTodayFood);
router.delete('/log/:id', deleteFoodLog);
router.put('/log/:id', updateFoodLog);
router.get('/summary', getFoodSummary);

module.exports = router;
