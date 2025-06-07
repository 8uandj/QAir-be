const AircraftService = require('../services/AircraftService');

exports.createAircraft = async (req, res) => {
  try {
    const { seat_layout } = req.body;
    if (seat_layout && (typeof seat_layout !== 'object' || !seat_layout.first_class || !seat_layout.business_class || !seat_layout.economy_class)) {
      return res.status(400).json({ success: false, error: 'seat_layout phải là object hợp lệ với first_class, business_class, economy_class' });
    }
    const aircraft = await AircraftService.create(req.body);
    res.status(201).json({ success: true, data: aircraft });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateAircraft = async (req, res) => {
  try {
    const { seat_layout } = req.body;
    if (seat_layout && (typeof seat_layout !== 'object' || !seat_layout.first_class || !seat_layout.business_class || !seat_layout.economy_class)) {
      return res.status(400).json({ success: false, error: 'seat_layout phải là object hợp lệ với first_class, business_class, economy_class' });
    }
    const aircraft = await AircraftService.updateAircraft(req.params.id, req.body, req.user);
    res.json({ success: true, data: aircraft });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAllAircrafts = async (req, res) => {
  try {
      const aircrafts = await AircraftService.getAllAircrafts();
      res.set('Cache-Control', 'no-store');
      res.json({ success: true, data: aircrafts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAircraftById = async (req, res) => {
  try {
    const aircraft = await AircraftService.getAircraftById(req.params.id);
    if (!aircraft) return res.status(404).json({ success: false, message: 'Aircraft not found' });
    res.json({ success: true, data: aircraft });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteAircraft = async (req, res) => {
  try {
    const result = await AircraftService.deleteAircraft(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};