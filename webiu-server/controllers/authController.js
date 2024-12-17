// controllers/authController.js
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../services/emailServices.js');
const crypto = require('crypto');
// const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

const register = async (req, res) => {
  const { name, email, password, confirmPassword, githubId } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid email format',
    });
  }

  // Validate password and confirmPassword
  if (password !== confirmPassword) {
    return res.status(400).json({
      status: 'error',
      message: 'Passwords do not match',
    });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists',
      });
    }

    // Generate a unique email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create a new user (email is not verified yet)
    const user = new User({
      name,
      email,
      password,
      githubId,
      verificationToken,
      isVerified: false,
    });
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please verify your email to log in.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};


// Verify user's email
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    // Find the user with the given token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined; // Clear the token
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if(!user){
        return res.status(401).json({
            status: 'error',
            message: 'User not found',
          });
    }
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    if(!user.isVerified){
      return res.status(401).json({
        status: 'error',
        message: 'Please verify your email to login',
      });
    }

    
    const token = signToken(user);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          githubId:user.githubId
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};



module.exports = { register, login,verifyEmail };
