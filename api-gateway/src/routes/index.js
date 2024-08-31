const express = require("express");
const proxy = require("express-http-proxy");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use("/playlists", authMiddleware, proxy("http://playlist-service:3000"));
router.use("/analysis", authMiddleware, proxy("http://analysis-service:3001"));

router.use("/auth", proxy("http://auth-service:3002"));


module.exports = router;
