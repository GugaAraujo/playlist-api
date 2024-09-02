const express = require("express");
const analysisController = require("../controllers/analysisController");

const router = express.Router();

router.get("/", analysisController.getAnalysis);

module.exports = router;
