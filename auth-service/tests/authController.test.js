const User = require("../src/models/user");
const { register, login } = require("../src/controllers/authController");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/user");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "testsecret";
  });

  test("should register a new user", async () => {
    const req = { body: { username: "testuser", password: "testpassword" } };
    const res = mockResponse();

    User.findOne.mockResolvedValue(null);
    User.prototype.save.mockResolvedValue({
      _id: "userId",
      username: "testuser",
    });

    const token = "fakeToken";
    jwt.sign.mockReturnValue(token);

    await register(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ username: "testuser" });
    expect(User.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ token });
  });

  test("should not register an existing user", async () => {
    const req = { body: { username: "existinguser", password: "password" } };
    const res = mockResponse();

    User.findOne.mockResolvedValue({ username: "existinguser" });

    await register(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ username: "existinguser" });
    expect(User.prototype.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User already exists" });
  });

  test("should login with valid credentials", async () => {
    const req = { body: { username: "testuser", password: "testpassword" } };
    const res = mockResponse();

    User.findOne.mockResolvedValue({
      _id: "userId",
      username: "testuser",
      comparePassword: jest.fn().mockResolvedValue(true),
    });

    const token = "fakeToken";
    jwt.sign.mockReturnValue(token);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ username: "testuser" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token });
  });

  test("should not login with invalid credentials", async () => {
    const req = { body: { username: "testuser", password: "wrongpassword" } };
    const res = mockResponse();

    User.findOne.mockResolvedValue({
      _id: "userId",
      username: "testuser",
      comparePassword: jest.fn().mockResolvedValue(false),
    });

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ username: "testuser" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });
});
