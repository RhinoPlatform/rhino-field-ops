const dispatcherController = {
  saveWeeklyRoute: async (_req, res) => {
    res.status(200).json({ success: true, message: 'Route saved locally' });
  },

  getLiveMapPins: async (_req, res) => {
    res.status(200).json({
      success: true,
      pins: [
        { id: 'asset-1', latitude: 31.9686, longitude: -102.0779, status: 'en-route' },
        { id: 'asset-2', latitude: 31.9, longitude: -101.9, status: 'at-site' }
      ]
    });
  }
};

module.exports = dispatcherController;
