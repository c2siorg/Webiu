const express = require('express');
const projectController = require('./../controllers/projectController');

const router = express.Router();

router.get('/issuesAndPr', projectController.getIssuesAndPr);

module.exports = router;
