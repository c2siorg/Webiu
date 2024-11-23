const express = require('express');
const contributorController = require('../controllers/contributorController');

const router = express.Router();
router.get('/contributors', contributorController.getAllContributors);
// Route for getting user-created issues
router.get('/issues/:username', contributorController.userCreatedIssues);

// Route for getting user-created pull requests
router.get('/pull-requests/:username', contributorController.userCreatedPullRequests);

module.exports = router;
