// server/models/hofComments.model.js
const oracledb = require('oracledb');
const db = require('../services/db.service');

async function getCommentsForPerson(personId) {
  const result = await db.execute(
    `
    SELECT
      COMMENT_ID,
      PERSON_ID,
      CASE
        WHEN IS_ANONYMOUS = 'Y' THEN 'Anonymous'
        WHEN DISPLAY_NAME IS NULL THEN 'Anonymous'
        ELSE DISPLAY_NAME
      END AS DISPLAY_NAME,
      CONTENT,
      CREATED_AT
    FROM HOF_PERSON_COMMENTS
    WHERE PERSON_ID = :personId
    ORDER BY CREATED_AT DESC
    `,
    { personId },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  return result.rows;
}

async function addCommentForPerson({ personId, displayName, isAnonymous, content }) {
  const binds = {
    commentId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    createdAt: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
    personId,
    displayName: displayName || null,
    isAnonymous: isAnonymous ? 'Y' : 'N',
    content,
  };

  const result = await db.execute(
    `
    INSERT INTO HOF_PERSON_COMMENTS (
      COMMENT_ID,
      PERSON_ID,
      DISPLAY_NAME,
      IS_ANONYMOUS,
      CONTENT
    ) VALUES (
      HOF_PERSON_COMMENTS_SEQ.NEXTVAL,
      :personId,
      :displayName,
      :isAnonymous,
      :content
    )
    RETURNING COMMENT_ID, CREATED_AT INTO :commentId, :createdAt
    `,
    binds,
    { autoCommit: true }      // <<< IMPORTANT
  );

  const newCommentId = result.outBinds.commentId[0];
  const createdAt = result.outBinds.createdAt[0];

  return {
    COMMENT_ID: newCommentId,
    PERSON_ID: personId,
    DISPLAY_NAME:
      isAnonymous || !displayName ? 'Anonymous' : displayName,
    CONTENT: content,
    CREATED_AT: createdAt,
  };
}

module.exports = {
  getCommentsForPerson,
  addCommentForPerson,
};
