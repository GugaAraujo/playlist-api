const client = require("prom-client");

const register = new client.Registry();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duração da requisição HTTP em milissegundos",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 300, 400, 500],
});

register.registerMetric(httpRequestDurationMicroseconds);

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register });

const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
};

async function metricsEndpoint(req, res) {
  try {
    const metrics = await register.metrics();
    res.set("Content-Type", register.contentType);
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err.toString());
  }
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
};
