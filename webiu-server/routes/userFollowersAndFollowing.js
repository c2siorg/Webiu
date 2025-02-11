const express = require("express");
const contributorController = require("../controllers/contributorController");

const router = express.Router();

router.get(
  "/followersAndFollowing/:username",
  contributorController.getUserFollowersAndFollowing
);

module.exports = router;
