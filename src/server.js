require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
require("./utils/telegramBot");
const http = require("http");
const { initSocket } = require("./realtime/socket");
const { startCronJobs } = require("./utils/cronJobs");

app.get("/", (req, res) => {
  res.json({ message: "AcademiQ backend is running ✅" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend working ✅" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  startCronJobs();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
