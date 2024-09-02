const Analysis = require("../models/analysis");
const { getCachedAnalysis, setCache } = require("../services/redisClient");

const CACHE_EXPIRATION = 5;

exports.getAnalysis = async (req, res) => {
  try {
    const user = JSON.parse(req.headers["x-user"]);
    const cacheKey = `analysis_${user.id}`;

    const cachedAnalysis = await getCachedAnalysis(cacheKey);
    if (cachedAnalysis) {
      return res.json(cachedAnalysis);
    }

    let analysis = await Analysis.findOne({ userId: user.id });
    if (!analysis) {
      analysis = await Analysis.create({
        userId: user.id,
        count: 0,
      })
    }

    setCache(cacheKey, analysis, CACHE_EXPIRATION);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
