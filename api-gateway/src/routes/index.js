const express = require("express");
const authMiddleware = require("../middleware/auth");
const createBreakerProxy = require("./../config/circuitBreakerProxy");

const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");

const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "swagger.json"), "utf8")
);

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

router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
