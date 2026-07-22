const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/inventory/truck-stock', verifyToken, requireRole(['Admin', 'Technician']), inventoryController.getTruckStock);
router.post('/inventory/restock', verifyToken, requireRole(['Admin']), inventoryController.restockTruck);

module.exports = router;
