const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../src/middleware/auth");

const app = express();
app.use(express.json());

app.get("/protected", authMiddleware, (req, res) => {
  res.status(200).json({ message: "Access granted" });
});

process.env.JWT_SECRET = "test_secret";

const validToken = jwt.sign({ id: "userId" }, process.env.JWT_SECRET, {
  expiresIn: "1h",
});

describe("Auth Middleware", () => {
  it("should allow access with a valid token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Access granted");
  });

  it("should deny access with an invalid token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalidToken");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid token");
  });

  it("should deny access without a token", async () => {
    const response = await request(app).get("/protected");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized");
  });

  it("should deny access with a malformed token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized");
  });
});
