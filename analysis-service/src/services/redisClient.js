const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

const getCachedAnalysis = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Error getting cache: ${err}`);
    throw err;
  }
};

const setCache = async (key, value, expireTime) => {
  try {
    await redisClient.setEx(key, expireTime, JSON.stringify(value));
  } catch (err) {
    console.error("Error setting cache:", err);
  }
};

const retryRedisConnection = async (options) => {
  let attempt = 0;
  const connect = async () => {
    try {
      await redisClient.connect();
      console.log("Redis client connected");
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
      attempt++;
      if (attempt < options.retries) {
        setTimeout(
          connect,
          Math.min(options.maxTimeout, options.minTimeout * 2 ** attempt)
        );
      } else {
        console.error("Failed to connect to Redis after multiple attempts");
      }
    }
  };
  connect();
};

const retryOptions = {
  retries: 5,
  minTimeout: 1000,
  maxTimeout: 5000,
};

retryRedisConnection(retryOptions);

module.exports = {
  getCachedAnalysis,
  setCache,
};
