const express = require('express');
const contributorController = require('../controllers/contributorController');

const router = express.Router();

// Route for getting all contributors
router.get('/contributors', contributorController.getAllContributors);

// Route for getting specific contributor details
router.get('/contributors/:login/details', async (req, res) => {
    const { login } = req.params;
    const issues = await contributorController.userCreatedIssues(login);
    const pullRequests = await contributorController.userCreatedPullRequests(login);
    
    res.status(200).json({ issues, pullRequests });
});

module.exports = router;
