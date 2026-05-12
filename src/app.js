const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const essayRoutes = require("./routes/essayRoutes");
const fileToolsRoutes = require("./routes/fileToolsRoutes");
const presentationRoutes = require("./routes/presentationRoutes");
const testRoutes = require("./routes/testRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const { login, register } = require("./controllers/authController");

const app = express();

// Ensure uploads directory exists
const fs = require("fs");
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://academiq-production-0920.up.railway.app",
  "https://thinky-production.up.railway.app" // Kelajakdagi yangi nom uchun
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(helmet({
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable for development to allow external scripts easily
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for development
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.get("/", (req, res) => {
  res.json({ message: "Thinky backend is running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend working" });
});

// Compatibility aliases for frontend clients expecting these paths.
app.post("/api/login", login);
app.post("/api/register", register);

const paymentRoutes = require("./routes/paymentRoutes");

const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const referralRoutes = require("./routes/referralRoutes");
const promoRoutes = require("./routes/promoRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const presenceRoutes = require("./routes/presenceRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin/manage", adminRoutes);
app.use("/api", essayRoutes);
app.use("/api", fileToolsRoutes);
app.use("/api", presentationRoutes);
app.use("/api", testRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", notificationRoutes);
app.use("/api", referralRoutes);
app.use("/api", promoRoutes);
app.use("/api", rewardRoutes);
app.use("/api", presenceRoutes);
app.use("/api/admin", adminAnalyticsRoutes);

const supportRoutes = require("./routes/supportRoutes");
const chatRoutes = require("./routes/chatRoutes");
const studyRoutes = require("./routes/studyRoutes");
const aiToolsRoutes = require("./routes/aiToolsRoutes");
const mathRoutes = require("./routes/mathRoutes");

app.use("/api", supportRoutes);
app.use("/api", chatRoutes);
app.use("/api", studyRoutes);
app.use("/api", aiToolsRoutes);
app.use("/api", mathRoutes);


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);

module.exports = app;

