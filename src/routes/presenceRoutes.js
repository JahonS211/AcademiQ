const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { pingPresence, getPresence } = require("../controllers/presenceController");

const router = express.Router();

router.post("/presence/ping", authMiddleware, pingPresence);
router.get("/presence/:userId", authMiddleware, getPresence);

module.exports = router;

