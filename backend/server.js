const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const dispatcherRoutes = require('./routes/dispatcherRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ONLINE', timestamp: new Date().toISOString() });
});

app.use('/api', authRoutes);
app.use('/api', ticketRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', dispatcherRoutes);
app.use('/api', analyticsRoutes);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚛 RHINO API ENGINE BOOTED SUCCESSFUL ON PORT ${PORT} `);
  console.log(`=======================================================`);
});
