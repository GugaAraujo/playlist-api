const { metricsMiddleware, metricsEndpoint } = require("./src/metrics/metrics");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const rabbitmqService = require("./src/services/rabbitmqService");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI);

app.use(metricsMiddleware);
app.get("/metrics", metricsEndpoint);
app.use("/", require("./src/routes/analysisRoutes"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Playlist Service running on port ${PORT}`);
  rabbitmqService.listenForEvents();
});
