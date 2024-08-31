const amqp = require("amqplib");

const publishToQueue = async (queue, message) => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(message));
    setTimeout(() => connection.close(), 2000);
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = { publishToQueue };
