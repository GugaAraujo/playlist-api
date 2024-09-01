const amqp = require("amqplib");
const Analysis = require("../src/models/analysis.js");
const { listenForEvents } = require("../src/services/rabbitmqService.js");

jest.mock("amqplib");
jest.mock("../src/models/analysis.js");

describe("Analysis Service", () => {
  let mockChannel;

  beforeEach(() => {
    mockChannel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      consume: jest.fn(),
      sendToQueue: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
    };
    amqp.connect.mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue(mockChannel),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should listen for playlist events and update analysis", async () => {
    const mockMessage = {
      content: Buffer.from(
        JSON.stringify({ event: "PlaylistCreated", data: { userId: "userId" } })
      ),
      properties: { headers: {} },
    };

    const mockAnalysis = { userId: "userId", playlistCount: 1 };
    Analysis.findOne.mockResolvedValue(null);
    Analysis.prototype.save = jest.fn().mockResolvedValue(mockAnalysis);

    mockChannel.consume.mockImplementation((queue, callback) => {
      callback(mockMessage);
    });

    await listenForEvents();

    expect(Analysis.findOne).toHaveBeenCalledWith({ userId: "userId" });
    expect(Analysis.prototype.save).toHaveBeenCalled();
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });

  it("should handle retry logic on failure", async () => {
    const mockMessage = {
      content: Buffer.from(
        JSON.stringify({ event: "PlaylistCreated", data: { userId: "userId" } })
      ),
      properties: { headers: { "x-retries": 0 } },
    };

    const error = new Error("Processing failed");
    Analysis.findOne.mockRejectedValue(error);

    mockChannel.consume.mockImplementation((queue, callback) => {
      callback(mockMessage);
    });

    await listenForEvents();

    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      "retry_queue",
      mockMessage.content,
      {
        headers: { "x-retries": 1 },
        expiration: 1000,
        persistent: true,
      }
    );
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });

  it("should move message to DLQ after max retries", async () => {
    const mockMessage = {
      content: Buffer.from(
        JSON.stringify({ event: "PlaylistCreated", data: { userId: "userId" } })
      ),
      properties: { headers: { "x-retries": 5 } },
    };

    const error = new Error("Processing failed");
    Analysis.findOne.mockRejectedValue(error);

    mockChannel.consume.mockImplementation((queue, callback) => {
      callback(mockMessage);
    });

    await listenForEvents();

    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      "dlq",
      mockMessage.content,
      {
        persistent: true,
      }
    );
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });
});
