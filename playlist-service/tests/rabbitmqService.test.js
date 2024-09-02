const amqp = require("amqplib");
const rabbitmqService = require("../src/services/rabbitmqService");

jest.mock("amqplib", () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn().mockResolvedValue(true),
      assertQueue: jest.fn().mockResolvedValue(true),
      bindQueue: jest.fn().mockResolvedValue(true),
      sendToQueue: jest.fn().mockResolvedValue(true),
    }),
  }),
}));

describe("RabbitMQ Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("publishToQueue", () => {
    it("should publish a message to the specified queue", async () => {
      const queue = "playlist_events";
      const message = JSON.stringify({
        event: "PlaylistCreated",
        data: {
          id: "playlistId",
          name: "My Playlist",
          tracks: [],
          userId: "userId",
          createdAt: new Date().toISOString(),
        },
      });

      await rabbitmqService.publishToQueue(queue, message);

      const connection = await amqp.connect(process.env.RABBITMQ_URI);
      const channel = await connection.createChannel();

      expect(amqp.connect).toHaveBeenCalledWith(process.env.RABBITMQ_URI);
      expect(channel.assertExchange).toHaveBeenCalledWith(
        "main_exchange",
        "direct",
        { durable: true }
      );
      expect(channel.assertQueue).toHaveBeenCalledWith(queue, {
        durable: true,
      });
      expect(channel.bindQueue).toHaveBeenCalledWith(
        queue,
        "main_exchange",
        "playlist_created"
      );
      expect(channel.assertQueue).toHaveBeenCalledWith("retry_queue", {
        durable: true,
      });
      expect(channel.assertQueue).toHaveBeenCalledWith("dlq", {
        durable: true,
      });
      expect(channel.bindQueue).toHaveBeenCalledWith(
        "retry_queue",
        "main_exchange",
        "retry"
      );
      expect(channel.bindQueue).toHaveBeenCalledWith(
        queue,
        "main_exchange",
        "playlist_created",
        {
          deadLetterExchange: "main_exchange",
          deadLetterRoutingKey: "dlq",
        }
      );
      expect(channel.sendToQueue).toHaveBeenCalledWith(
        queue,
        Buffer.from(message),
        { persistent: true }
      );
    });
  });
});
