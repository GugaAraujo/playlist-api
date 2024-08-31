const amqp = require("amqplib");
const Analysis = require("../models/analysis");

exports.listenForEvents = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    const channel = await connection.createChannel();
    await channel.assertQueue("playlist_events", { durable: true });

    channel.consume("playlist_events", async (msg) => {
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
      }

      channel.ack(msg);
    });

    console.log("Listening for playlist events...");
  } catch (error) {
    console.error("Error in RabbitMQ listener:", error);
  }
};
