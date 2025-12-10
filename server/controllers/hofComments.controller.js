// server/controllers/hofComments.controller.js
const hofCommentsModel = require('../models/hofComments.model');

async function getPersonComments(req, res, next) {
  try {
    const personId = Number(req.params.personId);
    if (!personId) {
      return res.status(400).json({ error: 'Invalid personId' });
    }

    const comments = await hofCommentsModel.getCommentsForPerson(personId);
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

async function addPersonComment(req, res, next) {
  try {
    const personId = Number(req.params.personId);
    const { displayName, isAnonymous, content } = req.body || {};

    if (!personId) {
      return res.status(400).json({ error: 'Invalid personId' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const newComment = await hofCommentsModel.addCommentForPerson({
      personId,
      displayName: displayName && displayName.trim(),
      isAnonymous: Boolean(isAnonymous),
      content: content.trim(),
    });

    res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPersonComments,
  addPersonComment,
};
