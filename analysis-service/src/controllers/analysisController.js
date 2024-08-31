const Analysis = require("../models/analysis");

exports.getAnalysis = async (req, res) => {
  try {
    const user = JSON.parse(req.headers["x-user"]);
    const analysis = await Analysis.findOne({ userId: user.id });

    if (!analysis) {
      return res.status(404).json({ message: "Análise não encontrada" });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
