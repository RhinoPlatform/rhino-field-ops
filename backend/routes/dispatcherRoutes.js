const express = require('express');
const router = express.Router();
const dispatcherController = require('../controllers/dispatcherController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/dispatcher/save-route', verifyToken, requireRole(['Admin', 'Dispatcher']), dispatcherController.saveWeeklyRoute);
router.get('/dispatcher/live-pins', verifyToken, requireRole(['Admin', 'Dispatcher', 'Technician']), dispatcherController.getLiveMapPins);

module.exports = router;
