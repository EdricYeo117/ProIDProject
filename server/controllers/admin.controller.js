// server/controllers/admin.controller.js
const adminModel = require("../models/admin.model");

async function getAchievementTypes(req, res, next) {
  try {
    const categoryId = req.query.categoryId || null;
    const rows = await adminModel.getAchievementTypes(categoryId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createPersonFull(req, res, next) {
  try {
    const payload = req.body || {};
    const adminUser = req.adminUser || "admin";
    const result = await adminModel.createPersonFull(payload, adminUser);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAchievementTypes,
  createPersonFull,
};
