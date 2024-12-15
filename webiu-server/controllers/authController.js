const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const register = async (req, res) => {
  const { name, email, password, confirmPassword, githubId } = req.body;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid email format",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      status: "error",
      message: "Passwords do not match",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const user = new User({ name, email, password, githubId });
    await user.save();
    const token = signToken(user);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          githubId: user.githubId,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const token = signToken(user);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          githubId: user.githubId,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


const googleLogin = async (req, res) => {
  try {
    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&scope=email%20profile`;
    res.redirect(googleAuthURL);
  } catch (error) {
    console.log(error);
  }
}

const googleLoginCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ message: "Authorization code missing" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }
    );

    if (tokenResponse.data.error) {
      return res.status(400).json({ message: tokenResponse.data.error_description });
    }

    const accessToken = tokenResponse.data.access_token;
    const idToken = tokenResponse.data.id_token;

    const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    const ticket = await oauth2Client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload(); 
    console.log("Verified User info:", payload);

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = new User({
        name: payload.name,
        email: payload.email,
        githubId: null,
        googleId: payload.sub,
      });
      await user.save();
    }
    const token = signToken(user); 
    res.redirect(`http://localhost:4200/login?token=${token}&id=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    console.error("Error during Google OAuth:", error);
    res.status(500).json({
      message: "Error authenticating with Google",
      error: error.response?.data || error.message,
    });
  }
};




const githubLogin = async (req, res) => {
  try {
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`
    res.redirect(githubAuthURL);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error during GitHub authentication" });
  }
};


const githubLoginCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ message: "Authorization code missing" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      null,
      {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.GITHUB_REDIRECT_URI,
        },
        headers: {
          accept: "application/json",
        },
      }
    );

    if (tokenResponse.data.error) {
      return res.status(400).json({ message: tokenResponse.data.error_description });
    }

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = userResponse.data;
    console.log("Verified GitHub User info:", githubUser);

    let user = await User.findOne({ email: githubUser.email });
    if (!user) {
      user = new User({
        name: githubUser.name,
        email: githubUser.email,
        githubId: githubUser.id,
        googleId: null,
      });
      await user.save();
    }

    const token = signToken(user); 
    res.redirect(`http://localhost:4200/login?token=${token}&id=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    console.error("Error during GitHub OAuth:", error);
    res.status(500).json({
      message: "Error authenticating with GitHub",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = { register, login, googleLogin ,googleLoginCallback,githubLogin, githubLoginCallback };
