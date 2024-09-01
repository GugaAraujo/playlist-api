const { getAnalysis } = require("../src/controllers/analysisController");
const Analysis = require("../src/models/analysis");

jest.mock("../src/models/analysis");

describe("Analysis Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      headers: {
        "x-user": JSON.stringify({ id: "userId" }),
      },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return analysis for a user", async () => {
    const mockAnalysis = { userId: "userId", playlistCount: 5 };
    Analysis.findOne.mockResolvedValue(mockAnalysis);

    await getAnalysis(req, res);

    expect(Analysis.findOne).toHaveBeenCalledWith({ userId: "userId" });
    expect(res.json).toHaveBeenCalledWith(mockAnalysis);
  });

  it("should return 404 if analysis not found", async () => {
    Analysis.findOne.mockResolvedValue(null);

    await getAnalysis(req, res);

    expect(Analysis.findOne).toHaveBeenCalledWith({ userId: "userId" });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Análise não encontrada",
    });
  });

  it("should return 500 if there is an error", async () => {
    const errorMessage = "Database error";
    Analysis.findOne.mockRejectedValue(new Error(errorMessage));

    await getAnalysis(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});
