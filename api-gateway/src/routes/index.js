const express = require("express");
const proxy = require("express-http-proxy");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const addUserIdHeader = (opts, req) => {
  if (req.user) {
    opts.headers["x-user"] = JSON.stringify(req.user);
  }
  return opts;
};

const createProxy = (serviceUrl) =>
  proxy(serviceUrl, {
    proxyReqOptDecorator: addUserIdHeader,
  });

router.use(
  "/playlists",
  authMiddleware,
  createProxy("http://playlist-service:3003")
);
router.use(
  "/analysis",
  authMiddleware,
  createProxy("http://analysis-service:3001")
);
router.use("/auth", createProxy("http://auth-service:3002"));

module.exports = router;
