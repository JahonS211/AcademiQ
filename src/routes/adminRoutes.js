const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const { 
  getUsers, 
  updateUser, 
  deleteUser, 
  blockUser,
  adminAssistantCommand
} = require("../controllers/adminController");

const router = express.Router();

router.use(adminMiddleware);

router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/block", blockUser);
router.post("/assistant", adminAssistantCommand);

module.exports = router;
