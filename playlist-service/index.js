const { metricsMiddleware, metricsEndpoint } = require("./src/metrics/metrics");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI);

app.use(metricsMiddleware);
app.get("/metrics", metricsEndpoint);
app.use("/", require("./src/routes/playlistRoutes"));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Playlist Service running on port ${PORT}`));
