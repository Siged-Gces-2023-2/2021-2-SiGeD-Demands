const moment = require('moment-timezone');
const Category = require('../Models/CategorySchema');
const validation = require('../Utils/validate');

const getCurrentUtcTimestamp = () => moment.utc(moment.tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss')).toDate();

const categoryGet = async (req, res) => {
  try {
    const categories = await Category.find().sort({ 'name': 1 });

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

const categoryCreate = async (req, res) => {
  const { name, description, color } = req.body;

  const validFields = validation.validateCategory(name, description, color);

  if (validFields.length) {
    return res.status(400).json({ status: validFields });
  }

  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(409).json({ message: 'The category already exists.' });
    }

    const newCategory = await Category.create({
      name,
      description,
      color,
      createdAt: getCurrentUtcTimestamp(),
      updatedAt: getCurrentUtcTimestamp(),
    });

    return res.json(newCategory);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
};

const categoryUpdate = async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  const validFields = validation.validateCategory(name, description, color);

  if (validFields.length) {
    return res.status(400).json({ status: validFields });
  }

  try {
    const updateStatus = await Category.findOneAndUpdate({ _id: id }, {
      name,
      description,
      color,
      updatedAt: getCurrentUtcTimestamp(),
    }, { new: true }, (user) => user);
    return res.json(updateStatus);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update category.' });
  }
};

const categoryDelete = async (req, res) => {
  const { id } = req.params;

  try {
    await Category.deleteOne({ _id: id });
    return res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to delete category.' });
  }
};

const categoryId = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findOne({ _id: id });
    return res.status(200).json(category);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid ID or category not found.' });
  }
};

module.exports = {
  categoryGet, categoryCreate, categoryUpdate, categoryDelete, categoryId,
};
