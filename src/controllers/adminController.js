const User = require("../models/User");
const Presentation = require("../models/Presentation");

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, planType } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (planType) user.planType = planType;

    await user.save();
    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isBlocked, blockedUntil } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = isBlocked;
    user.blockedUntil = blockedUntil ? new Date(blockedUntil) : null;

    await user.save();
    return res.status(200).json({ 
      message: isBlocked ? "User blocked" : "User unblocked", 
      user 
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  blockUser
};
