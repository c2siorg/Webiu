const express = require('express');
const contributorController = require('../controllers/contributorController');

const router = express.Router();
router.get('/contributors', contributorController.getAllContributors);

module.exports = router;
