// server/routes/hofComments.routes.js
const express = require('express');
const router = express.Router();
const hofCommentsController = require('../controllers/hofComments.controller');

// GET all comments for a given person
router.get('/persons/:personId/comments', hofCommentsController.getPersonComments);

// POST a new comment for a given person
router.post('/persons/:personId/comments', hofCommentsController.addPersonComment);

module.exports = router;
