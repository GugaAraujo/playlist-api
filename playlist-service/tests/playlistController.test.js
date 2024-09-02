const {
  createPlaylist,
  getAllPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
} = require("../src/controllers/playlistController");
const rabbitmqService = require("../src/services/rabbitmqService");
const Playlist = require("../src/models/playlist");

jest.mock("../src/services/rabbitmqService");
jest.mock("../src/models/playlist");

describe("Playlist Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {
        "x-user": JSON.stringify({ id: "userId" }),
      },
      body: {
        name: "My Playlist",
        tracks: [],
      },
      params: {
        id: "playlistId",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("createPlaylist", () => {
    it("should create a new playlist and publish an event", async () => {
      const newPlaylist = {
        _id: "playlistId",
        name: "My Playlist",
        tracks: [],
        userId: "userId",
        createdAt: new Date().toISOString(),
        save: jest.fn().mockResolvedValue(this),
      };

      Playlist.mockImplementation(() => newPlaylist);

      rabbitmqService.publishToQueue = jest.fn().mockResolvedValue(true);

      await createPlaylist(req, res);

      expect(newPlaylist.save).toHaveBeenCalled();
      expect(Playlist).toHaveBeenCalledWith({
        name: "My Playlist",
        tracks: [],
        userId: "userId",
      });

      expect(rabbitmqService.publishToQueue).toHaveBeenCalledWith(
        "playlist_events",
        JSON.stringify({
          event: "PlaylistCreated",
          data: {
            id: newPlaylist._id,
            name: newPlaylist.name,
            tracks: newPlaylist.tracks,
            userId: newPlaylist.userId,
            createdAt: newPlaylist.createdAt,
          },
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newPlaylist);
    });

    it("should handle errors", async () => {
      const newPlaylist = {
        save: jest.fn().mockRejectedValue(new Error("Error saving playlist")),
      };
      Playlist.mockImplementation(() => newPlaylist);

      await createPlaylist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error saving playlist" });
    });
  });

  describe("getAllPlaylists", () => {
    it("should return all playlists for the user", async () => {
      const playlists = [
        {
          _id: "playlistId1",
          name: "Playlist 1",
          tracks: [],
          userId: "userId",
        },
        {
          _id: "playlistId2",
          name: "Playlist 2",
          tracks: [],
          userId: "userId",
        },
      ];

      Playlist.find = jest.fn().mockResolvedValue(playlists);

      await getAllPlaylists(req, res);

      expect(Playlist.find).toHaveBeenCalledWith({ userId: "userId" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(playlists);
    });

    it("should handle errors", async () => {
      Playlist.find = jest
        .fn()
        .mockRejectedValue(new Error("Failed to get playlists"));

      await getAllPlaylists(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to get playlists",
      });
    });
  });

  describe("getPlaylistById", () => {
    it("should return a playlist by ID if it belongs to the user", async () => {
      const playlist = {
        _id: "playlistId",
        name: "My Playlist",
        tracks: [],
        userId: "userId",
      };

      Playlist.findOne = jest.fn().mockResolvedValue(playlist);

      await getPlaylistById(req, res);

      expect(Playlist.findOne).toHaveBeenCalledWith({
        _id: "playlistId",
        userId: "userId",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(playlist);
    });

    it("should return 404 if the playlist does not belong to the user", async () => {
      Playlist.findOne = jest.fn().mockResolvedValue(null);

      await getPlaylistById(req, res);

      expect(Playlist.findOne).toHaveBeenCalledWith({
        _id: "playlistId",
        userId: "userId",
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Playlist not found or access denied",
      });
    });

    it("should handle errors", async () => {
      Playlist.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Failed to get playlist"));

      await getPlaylistById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to get playlist",
      });
    });
  });

  describe("updatePlaylist", () => {
    it("should update a playlist and publish an event", async () => {
      const updatedPlaylist = {
        _id: "playlistId",
        name: "Updated Playlist",
        tracks: [],
        userId: "userId",
        createdAt: "2024-09-01T00:11:57.650Z",
      };

      Playlist.findOneAndUpdate = jest.fn().mockResolvedValue(updatedPlaylist);

      rabbitmqService.publishToQueue = jest.fn();

      req.body.name = "Updated Playlist";

      await updatePlaylist(req, res);

      expect(Playlist.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "playlistId", userId: "userId" },
        { name: "Updated Playlist", tracks: [] },
        { new: true }
      );

      expect(rabbitmqService.publishToQueue).toHaveBeenCalledWith(
        "playlist_events",
        JSON.stringify({
          event: "PlaylistUpdated",
          data: {
            id: updatedPlaylist._id,
            name: updatedPlaylist.name,
            tracks: updatedPlaylist.tracks,
            userId: updatedPlaylist.userId,
            createdAt: updatedPlaylist.createdAt,
          },
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedPlaylist);
    });

    it("should handle errors", async () => {
      Playlist.findOneAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Failed to update playlist"));

      await updatePlaylist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to update playlist",
      });
    });
  });
  describe("deletePlaylist", () => {
    it("should delete a playlist and publish an event", async () => {
      const deletedPlaylist = {
        _id: "playlistId",
        name: "Deleted Playlist",
        tracks: [],
        userId: "userId",
        createdAt: "2024-09-01T00:11:57.650Z",
      };

      Playlist.findOneAndDelete = jest.fn().mockResolvedValue(deletedPlaylist);
      rabbitmqService.publishToQueue = jest.fn();

      await deletePlaylist(req, res);

      expect(Playlist.findOneAndDelete).toHaveBeenCalledWith({
        _id: "playlistId",
        userId: "userId",
      });

      expect(rabbitmqService.publishToQueue).toHaveBeenCalledWith(
        "playlist_events",
        JSON.stringify({
          event: "PlaylistDeleted",
          data: {
            id: deletedPlaylist._id,
            name: deletedPlaylist.name,
            tracks: deletedPlaylist.tracks,
            userId: deletedPlaylist.userId,
            createdAt: deletedPlaylist.createdAt,
          },
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Playlist deleted successfully",
      });
    });

    it("should handle errors", async () => {
      Playlist.findOneAndDelete = jest
        .fn()
        .mockRejectedValue(new Error("Failed to delete playlist"));

      await deletePlaylist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to delete playlist",
      });
    });
  });
});
