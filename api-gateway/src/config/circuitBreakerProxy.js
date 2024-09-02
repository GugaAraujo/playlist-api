const axios = require("axios");
const CircuitBreaker = require("opossum");
const logger = require("./logger");

const addUserIdHeader = (headers, req) => {
  if (req.user) {
    headers["x-user"] = JSON.stringify(req.user);
  }
  return headers;
};

const createCircuitBreaker = (serviceUrl) => {
  const options = {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 20000,
  };

  const axiosInstance = axios.create({
    baseURL: serviceUrl,
    timeout: options.timeout,
  });

  const circuitBreaker = new CircuitBreaker((req) => {
    const headers = addUserIdHeader({}, req);
    return axiosInstance({
      method: req.method,
      url: req.url,
      headers: headers,
      data: req.body,
    }).then((response) => response.data);
  }, options);

  Object.entries({
    open: "warn",
    halfOpen: "info",
    close: "info",
    fallback: "warn",
    success: "info",
    failure: "error",
  }).forEach(([event, level]) => {
    circuitBreaker.on(event, () => {
      logger[level](`Circuit breaker ${event} for ${serviceUrl}`);
    });
  });

  const handleRequest = (req, res) => {
    circuitBreaker
      .fire(req)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        logger.error(`Request failed: ${error.message}`);

        if (error.isAxiosError && error.response) {
          res.status(error.response.status).send(error.response.data);
        } else {
          res.status(502).send("Bad Gateway");
        }
      });
  };

  return handleRequest;
};

module.exports = createCircuitBreaker;
