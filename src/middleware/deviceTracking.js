const crypto = require("crypto");
const SessionDevice = require("../models/SessionDevice");

const hash = (s) => crypto.createHash("sha256").update(String(s || "")).digest("hex");

const getIp = (req) => {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.ip || req.connection?.remoteAddress || "";
};

// Non-invasive device/session tracking.
// Uses header x-device-id if present; otherwise hashes UA+IP as best-effort fallback.
const deviceTracking = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user?._id) return next();

    const ip = getIp(req);
    const ua = req.headers["user-agent"] || "";
    const deviceId = req.headers["x-device-id"] || "";
    const fingerprint = hash(deviceId ? `d:${deviceId}` : `ua:${ua}|ip:${ip}`);

    await SessionDevice.updateOne(
      { userId: user._id, fingerprint },
      {
        $set: { ip, userAgent: ua, lastSeenAt: new Date() },
        $setOnInsert: { flags: [], suspiciousScore: 0 },
      },
      { upsert: true }
    );

    return next();
  } catch (e) {
    // don't block requests if tracking fails
    return next();
  }
};

module.exports = deviceTracking;

