const Playlist = require("../models/playlist");
const rabbitmqService = require("../services/rabbitmqService");
const logger = require("../config/logger");

exports.createPlaylist = async (req, res) => {
  try {
    const user = JSON.parse(req.headers["x-user"]);
    const { name, tracks } = req.body;

    const newPlaylist = new Playlist({ name, tracks, userId: user.id });
    await newPlaylist.save();

    const { _id: id, userId, createdAt } = newPlaylist;
    const data = { id, name, tracks, userId, createdAt };

    const eventMessage = JSON.stringify({
      event: "PlaylistCreated",
      data,
    });

    logger.info(`Playlist created: ${JSON.stringify(data)}`);
    rabbitmqService.publishToQueue("playlist_events", eventMessage);

    res.status(201).json(newPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPlaylists = async (req, res) => {
  try {
    const user = JSON.parse(req.headers["x-user"]);
    const playlists = await Playlist.find({ userId: user.id });
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPlaylistById = async (req, res) => {
  try {
    const user = JSON.parse(req.headers["x-user"]);
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      userId: user.id,
    });

    if (!playlist) {
      return res
        .status(404)
        .json({ error: "Playlist not found or access denied" });
    }

    res.status(200).json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePlaylist = async (req, res) => {
  try {
    const user = JSON.parse(req.headers["x-user"]);
    const { name, tracks } = req.body;

    const updatedPlaylist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, userId: user.id },
      { name, tracks },
      { new: true }
    );

    if (!updatedPlaylist) {
      return res
        .status(404)
        .json({ error: "Playlist not found or access denied" });
    }

    const eventMessage = JSON.stringify({
      event: "PlaylistUpdated",
      data: {
        id: updatedPlaylist._id,
        name: updatedPlaylist.name,
        tracks: updatedPlaylist.tracks,
        userId: updatedPlaylist.userId,
        createdAt: updatedPlaylist.createdAt,
      },
    });

    rabbitmqService.publishToQueue("playlist_events", eventMessage);

    res.status(200).json(updatedPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    const user = JSON.parse(req.headers["x-user"]);
    const deletedPlaylist = await Playlist.findOneAndDelete({
      _id: req.params.id,
      userId: user.id,
    });

    if (!deletedPlaylist) {
      return res
        .status(404)
        .json({ error: "Playlist not found or access denied" });
    }

    const eventMessage = JSON.stringify({
      event: "PlaylistDeleted",
      data: {
        id: deletedPlaylist._id,
        name: deletedPlaylist.name,
        tracks: deletedPlaylist.tracks,
        userId: deletedPlaylist.userId,
        createdAt: deletedPlaylist.createdAt,
      },
    });

    rabbitmqService.publishToQueue("playlist_events", eventMessage);

    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
