const express = require('express');
const projectController = require('./../controllers/projectController');

const router = express.Router();

router.get('/projects', projectController.getAllProjects);

module.exports = router;
