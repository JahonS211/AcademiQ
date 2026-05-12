const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");
const { explainMath } = require("../controllers/mathController");
const { mathLabCost } = require("../config/dynamicCreditCosts");

const router = express.Router();

router.post("/math-lab/solve", authMiddleware, checkCredits(mathLabCost, "Math Lab", ["pro", "pro_plus"]), explainMath);

module.exports = router;
