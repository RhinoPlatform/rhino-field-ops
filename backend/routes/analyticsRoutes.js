const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/analytics/billing-report', verifyToken, requireRole(['Admin']), analyticsController.getMonthlyBillingReport);
router.get('/analytics/route-progression', verifyToken, requireRole(['Admin', 'Dispatcher']), analyticsController.getTodaysRouteProgression);
router.get('/analytics/equipment-lifecycle', verifyToken, requireRole(['Admin']), analyticsController.getEquipmentLifecycleAudit);

module.exports = router;
