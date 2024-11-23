// controllers/authController.js
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;


const register = async (req, res) => {
  const { name, email, password, confirmPassword, githubId } = req.body;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid email format',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      status: 'error',
      message: 'Passwords do not match',
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists',
      });
    }

    const user = new User({ name, email, password, githubId });
    await user.save();

    const token = signToken(user);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
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

module.exports = { register, login };
