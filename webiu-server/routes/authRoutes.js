// routes/authRoutes.js
const express = require('express');
const { register, login, googleLogin, googleLoginCallback, githubLogin , githubLoginCallback } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get("/google",googleLogin);
router.get("/google/callback", googleLoginCallback);
router.get("/github",githubLogin);
router.get("/github/callback", githubLoginCallback);
module.exports = router;
