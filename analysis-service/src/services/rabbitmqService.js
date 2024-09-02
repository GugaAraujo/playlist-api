const amqp = require("amqplib");
const Analysis = require("../models/analysis");
const logger = require("../config/logger");

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 10000;

async function createChannel() {
  const connection = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await connection.createChannel();

  await channel.assertExchange("main_exchange", "direct", { durable: true });

  await channel.assertQueue("playlist_events", { durable: true });
  await channel.bindQueue(
    "playlist_events",
    "main_exchange",
    "playlist_created"
  );

  await channel.assertQueue("retry_queue", { durable: true });
  await channel.assertQueue("dlq", { durable: true });

  await channel.bindQueue("retry_queue", "main_exchange", "retry");

  await channel.bindQueue(
    "playlist_events",
    "main_exchange",
    "playlist_created",
    {
      deadLetterExchange: "main_exchange",
      deadLetterRoutingKey: "dlq",
    }
  );

  return channel;
}

async function listenForEvents() {
  let retryAttempts = 0;

  while (retryAttempts < MAX_RETRY_ATTEMPTS) {
    try {
      const channel = await createChannel();

      channel.consume("playlist_events", async (msg) => {
        try {
          const event = JSON.parse(msg.content.toString());

          if (event.event === "PlaylistCreated") {
            const { userId } = event.data;

            let stats = await Analysis.findOne({ userId });

            if (!stats) {
              stats = new Analysis({ userId, playlistCount: 1 });
            } else {
              stats.playlistCount += 1;
            }

            await stats.save();
            logger.info(`Count updated: ${JSON.stringify(stats)}`);
          }

          channel.ack(msg);
        } catch (error) {
          console.error("Processing failed", error);

          const retries = msg.properties.headers["x-retries"] || 0;

          if (retries < MAX_RETRY_ATTEMPTS) {
            const delay = Math.pow(2, retries) * 1000;
            channel.sendToQueue("retry_queue", msg.content, {
              headers: { "x-retries": retries + 1 },
              expiration: delay,
              persistent: true,
            });

            console.log(`Retrying in ${delay}ms... (Attempt ${retries + 1})`);
          } else {
            channel.sendToQueue("dlq", msg.content, {
              persistent: true,
            });

            console.log("Message sent to DLQ");
          }

          channel.ack(msg);
        }
      });

      channel.consume("retry_queue", async (msg) => {
        try {
          channel.sendToQueue("playlist_events", msg.content, {
            headers: msg.properties.headers,
            persistent: true,
          });
          channel.ack(msg);
        } catch (error) {
          console.error("Retry failed", error);
          channel.nack(msg, false, false);
        }
      });

      console.log("Listening for playlist events...");
      break;
    } catch (error) {
      console.error("Error in RabbitMQ listener:", error);

      retryAttempts++;
      if (retryAttempts < MAX_RETRY_ATTEMPTS) {
        console.log(
          `Retrying connection in ${RETRY_DELAY_MS}ms... (Attempt ${retryAttempts})`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        console.error("Max retry attempts reached. Exiting...");
      }
    }
  }
}

module.exports = {
  listenForEvents,
};
