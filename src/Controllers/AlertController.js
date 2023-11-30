const moment = require('moment-timezone');
const Alert = require('../Models/AlertSchema');
const validation = require('../Utils/validate');

const getCurrentUtcTimestamp = () => moment.utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss')).toDate();

const timeSevenDaysAfter = () => moment.utc(moment.tz('America/Sao_Paulo').add(7, 'days').format('YYYY-MM-DD')).toDate();

const alertGet = async (req, res) => {
  try {
    const alerts = await Alert.find();

    return res.json(alerts);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
};

const filterAlertsByDate = (alerts, dateNow, sevenDaysAfter) => {
  return alerts.filter((alert) =>
    (moment(alert.date).isSameOrBefore(sevenDaysAfter) && moment(alert.date).isSameOrAfter(dateNow)) ||
    alert.checkbox === false
  );
};

const alertGetByDemandId = async (req, res) => {
  const { demandID } = req.params;
  const dateNow = getCurrentUtcTimestamp();
  const sevenDaysAfter = timeSevenDaysAfter();

  try {
    const alerts = await Alert.find({ demandID });
    const filteredAlerts = filterAlertsByDate(alerts, dateNow, sevenDaysAfter);
    return res.status(200).json(filteredAlerts);
  } catch {
    return res.status(400).json({ err: 'Failed to get alerts by demand ID' });
  }
};

const alertGetBySectorId = async (req, res) => {
  const { sectorID } = req.params;
  const dateNow = getCurrentUtcTimestamp();
  const sevenDaysAfter = timeSevenDaysAfter();

  try {
    const alerts = await Alert.find({ sectorID });
    const filteredAlerts = filterAlertsByDate(alerts, dateNow, sevenDaysAfter);
    return res.status(200).json(filteredAlerts);
  } catch {
    return res.status(400).json({ err: 'Failed to get alerts by sector ID' });
  }
};

const alertCreate = async (req, res) => {
  const {
    name, description, date, alertClient, demandID, sectorID,
  } = req.body;

  const validFields = validation.validateAlert(name, description, date, demandID, sectorID);

  if (validFields.length) {
    return res.status(400).json({ status: validFields });
  }

  try {
    const newAlert = await Alert.create({
      name,
      description,
      date,
      alertClient,
      demandID,
      sectorID,
      createdAt: getCurrentUtcTimestamp(),
      updatedAt: getCurrentUtcTimestamp(),
    });
    return res.json(newAlert);
  } catch {
    return res.status(400).json({ error: 'Failed to create the alert.' });
  }
};

const alertUpdate = async (req, res) => {
  const { id } = req.params;
  const {
    name, description, date, alertClient, checkbox, demandID, sectorID,
  } = req.body;

  const validFields = validation.validateAlert(name, description, date, demandID, sectorID);

  if (validFields.length) {
    return res.status(400).json({ status: validFields });
  }

  try {
    const updateStatus = await Alert.findOneAndUpdate({ _id: id }, {
        name,
        description,
        date,
        alertClient,
        checkbox,
        demandID,
        sectorID,
        updatedAt: getCurrentUtcTimestamp(),
      }, { new: true }, (user) => user);
    return res.json(updateStatus);
  } catch {
    return res.status(400).json({ err: 'Invalid ID or alert not found.' });
  }
};

const alertDelete = async (req, res) => {
  const { id } = req.params;

  try {
    await Alert.deleteOne({ _id: id });
    return res.json({ message: 'Alert deleted successfully.' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete alert.' });
  }
};

module.exports = {
  alertGet, alertCreate, alertGetByDemandId, alertGetBySectorId, alertUpdate, alertDelete,
};
