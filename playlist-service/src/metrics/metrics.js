const client = require("prom-client");

const register = new client.Registry();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in milliseconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 300, 400, 500],
});
register.registerMetric(httpRequestDurationMicroseconds);

const memoryUsageGauge = new client.Gauge({
  name: "nodejs_memory_usage_bytes",
  help: "Memory usage in bytes",
  labelNames: ["type"],
});
register.registerMetric(memoryUsageGauge);

const cpuUsageGauge = new client.Gauge({
  name: "nodejs_cpu_usage_seconds_total",
  help: "CPU usage in seconds",
  labelNames: ["type"],
});
register.registerMetric(cpuUsageGauge);

function updateMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  memoryUsageGauge.set({ type: "heap_total" }, memoryUsage.heapTotal);
  memoryUsageGauge.set({ type: "heap_used" }, memoryUsage.heapUsed);
  memoryUsageGauge.set({ type: "rss" }, memoryUsage.rss);
}

function updateCpuUsage() {
  const cpuUsage = process.cpuUsage();
  cpuUsageGauge.set({ type: "user" }, cpuUsage.user / 1e6);
  cpuUsageGauge.set({ type: "system" }, cpuUsage.system / 1e6);
}

setInterval(() => {
  updateMemoryUsage();
  updateCpuUsage();
}, 5000);

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
