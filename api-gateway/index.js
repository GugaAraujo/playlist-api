const express = require("express");
const routes = require("./src/routes");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

dotenv.config();

const limiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 60,
  message: "Too many requests from this IP, please try again after 3 minutes",
});

const corsOptions = {};
if (process.env.NODE_ENV === "production") {
  corsOptions["origin"] = process.env.ALLOWED_DOMAIN;
} else {
  corsOptions["origin"] = "*";
}

const app = express();
app.use(cors(corsOptions));
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
