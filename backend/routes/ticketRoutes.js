const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/tickets', verifyToken, requireRole(['Admin', 'Technician']), ticketController.createTicket);
router.get('/tickets/pending-audit', verifyToken, requireRole(['Admin']), ticketController.getPendingAuditQueue);
router.get('/tickets/optimized-route', verifyToken, requireRole(['Admin', 'Dispatcher', 'Technician']), ticketController.getGeoOptimizedRoute);
router.patch('/tickets/:folio/approve', verifyToken, requireRole(['Admin']), ticketController.approveTicket);

module.exports = router;
