const express = require("express");
const authMiddleware = require("../middleware/auth");
const createBreakerProxy = require("./../config/circuitBreakerProxy");

const router = express.Router();

router.use("/playlists", authMiddleware, (req, res, next) =>
  createBreakerProxy("http://playlist-service:3003")(req, res, next)
);

router.use("/analysis", authMiddleware, (req, res, next) =>
  createBreakerProxy("http://analysis-service:3001")(req, res, next)
);

router.use("/auth", (req, res, next) =>
  createBreakerProxy("http://auth-service:3002")(req, res, next)
);

module.exports = router;
