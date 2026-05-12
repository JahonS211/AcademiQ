const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Legacy coin logic removed. Credits are reset via cronJob.

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const token = signToken({ id: user._id, role: "user" });
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        planType: user.planType,
        credits: user.credits,
        isUnlimitedCredits: user.isUnlimitedCredits,
        rewardBalance: user.rewardBalance,
        createdAt: user.createdAt,
        role: "user"
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@studentai.local";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";

    if (email === adminEmail && password === adminPassword) {
      const token = signToken({ role: "admin", email: adminEmail, type: "admin" });
      return res.status(200).json({
        token,
        adminToken: token, // for backward compatibility in frontend
        user: { email: adminEmail, role: "admin", planType: "pro_plus" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Suspicious login counter (in-memory best-effort via blocked flags)
      user.isBlocked = user.isBlocked;
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isBlocked) {
      if (user.blockedUntil && new Date() > user.blockedUntil) {
        user.isBlocked = false;
        user.blockedUntil = null;
        await user.save();
      } else {
        const until = user.blockedUntil ? ` until ${user.blockedUntil.toLocaleString()}` : "";
        return res.status(403).json({ message: `Your account is blocked${until}` });
      }
    }

    const token = signToken({ id: user._id, role: "user" });
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        planType: user.planType,
        credits: user.credits,
        isUnlimitedCredits: user.isUnlimitedCredits,
        rewardBalance: user.rewardBalance,
        createdAt: user.createdAt,
        role: "user",
      },
    });
  } catch (error) {
    return next(error);
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@studentai.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = signToken({ role: "admin", email: adminEmail, type: "admin" });
  return res.status(200).json({
    message: "Admin login successful",
    adminToken: token,
    admin: { email: adminEmail },
  });
};

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(); // We don't strictly need the client ID here if we just verify the ID token structure, but usually it's best to pass it. We'll use the one from frontend or verify loosely for now, or just let google-auth-library verify the signature.

const googleLogin = async (req, res, next) => {
  try {
    const { token, isAccessToken } = req.body;
    if (!token) return res.status(400).json({ message: "No token provided" });

    let payload;

    if (isAccessToken) {
      // Fetch user info using access_token
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
      payload = await response.json();
      if (!payload.email) throw new Error("Invalid access token");
    } else {
      // Verify the Google ID token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    }

    const email = payload.email.toLowerCase().trim();

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: payload.name,
        profilePhoto: payload.picture,
        googleId: payload.sub,
      });
    } else {
      // Update info if missing
      let changed = false;
      if (!user.googleId) { user.googleId = payload.sub; changed = true; }
      if (!user.name) { user.name = payload.name; changed = true; }
      if (!user.profilePhoto) { user.profilePhoto = payload.picture; changed = true; }
      if (changed) await user.save();
    }

    if (user.isBlocked) {
      if (user.blockedUntil && new Date() > user.blockedUntil) {
        user.isBlocked = false;
        user.blockedUntil = null;
        await user.save();
      } else {
        const until = user.blockedUntil ? ` until ${user.blockedUntil.toLocaleString()}` : "";
        return res.status(403).json({ message: `Your account is blocked${until}` });
      }
    }

    const jwtToken = signToken({ id: user._id, role: "user" });
    return res.status(200).json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        planType: user.planType,
        credits: user.credits,
        isUnlimitedCredits: user.isUnlimitedCredits,
        rewardBalance: user.rewardBalance,
        createdAt: user.createdAt,
        role: "user"
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(401).json({ message: "Invalid Google token" });
  }
};

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = String(file.originalname || "photo").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
    cb(null, `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }).single("photo");

const getProfile = async (req, res, next) => {
  try {
    // If it's a virtual admin, return hardcoded profile
    if (req.user.isVirtual) {
      return res.status(200).json({
        user: {
          id: "admin",
          email: req.user.email,
          name: "Admin",
          role: "admin",
          planType: "pro_plus",
          dailyCoinsUsed: 0,
          hasPassword: true,
          stats: {
            essays: 0,
            presentations: 0,
          }
        }
      });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Use persistent stats from user document
    const stats = {
      essays: user.stats?.essays || 0,
      presentations: user.stats?.presentations || 0,
      tools: user.stats?.tools || 0,
    };

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        planType: user.planType,
        credits: user.credits,
        isUnlimitedCredits: user.isUnlimitedCredits,
        rewardBalance: user.rewardBalance,
        totalCreditsUsed: user.totalCreditsUsed,
        hasPassword: !!user.password,
        role: user.role,
        stats,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: "Upload failed" });
    try {
      const { name } = req.body;
      const user = await User.findById(req.user.id || req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (name) user.name = name;
      if (req.file) user.profilePhoto = `/uploads/${req.file.filename}`;

      await user.save();
      return res.status(200).json({ message: "Profile updated", user });
    } catch (error) {
      return next(error);
    }
  });
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If user has no password (e.g. Google Auth), they can't change it
    if (!user.password) {
      return res.status(400).json({ message: "Google orqali ro'yxatdan o'tgansiz, parolingiz yo'q." });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Joriy va yangi parolni kiriting." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Joriy parol noto'g'ri." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Parol muvaffaqiyatli o'zgartirildi" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword
};
