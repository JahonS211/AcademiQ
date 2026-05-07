const express = require("express");
const { register, login, adminLogin, googleLogin, getProfile, updateProfile } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const loginLimiter = require("../middleware/loginThrottle");

const router = express.Router();

router.post("/register", loginLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/admin/login", loginLimiter, adminLogin);
router.post("/google", loginLimiter, googleLogin);

router.get("/profile", authMiddleware, getProfile);
router.post("/profile", authMiddleware, updateProfile);

module.exports = router;
