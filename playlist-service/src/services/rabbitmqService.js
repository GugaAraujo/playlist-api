const amqp = require("amqplib");

const publishToQueue = async (queue, message) => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    const channel = await connection.createChannel();

    await channel.assertExchange("main_exchange", "direct", { durable: true });

    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, "main_exchange", "playlist_created");

    await channel.assertQueue("retry_queue", { durable: true });
    await channel.assertQueue("dlq", { durable: true });

    await channel.bindQueue("retry_queue", "main_exchange", "retry");

    await channel.bindQueue(queue, "main_exchange", "playlist_created", {
      deadLetterExchange: "main_exchange",
      deadLetterRoutingKey: "dlq",
    });

    channel.sendToQueue(queue, Buffer.from(message), {
      persistent: true,
    });

    setTimeout(() => connection.close(), 2000);
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = { publishToQueue };
