import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
   try {
     const {name, description} = req.body
     //TODO: create playlist
     
     if(!name){
         throw new apiError(400, "Playlist name is required");
     }
     if(!req.user || !req.user._id){
         throw new apiError(401, "Unauthorized");
     }
 
     const playlist = await Playlist.create({
         name, 
         description,   
         owner: req.user._id,
         videos: []
     });
 
     return res.status(201).json(
        new apiResponse(
            201, 
            {playlist}, 
            "Playlist created successfully"
        ));
   } catch (error) {
        throw new apiError(500, error.message);
   }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        throw new apiError(400, "Invalid user id");
    }
    
    const playlists = await Playlist.find({owner: userId})
    .populate("owner", "username email avatar").lean();

    return res.status(200).json(
        new apiResponse(
            200, 
            {playlists}, 
            "User playlists retrieved successfully"
        ));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by 
    
    if(!isValidObjectId(playlistId)){ 
        throw new apiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",   
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $unwind: "$owner",
            preserveNullAndEmptyArrays: true
        },
        {
            $project: {
                "owner.password": 0,
                "owner.refreshToken": 0,
                "owner.email": 0,
                "videos.owner": 0
            }
        }
    ]).exec();

    if(!playlist || playlist.length === 0){
        throw new apiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new apiResponse(
            200, 
            {playlist: playlist[0]}, 
            "Playlist retrieved successfully"
        ));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new apiError(400, "Invalid playlist or video id");
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId, 
        {$push: {videos: videoId}},
        {new: true}
    );

    if(!playlist){
        throw new apiError(404, "Playlist not found");
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json(
        new apiResponse(
            200, 
            {playlist}, 
            "Video added to playlist successfully"
        ));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new apiError(400, "Invalid playlist or video id");
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId, 
        {$pull: {videos: videoId}},
        {new: true}
    );

    if(!playlist){
        throw new apiError(404, "Playlist not found");
    }
    await session.commitTransaction();
    session.endSession();
    return res.status(200).json(
        new apiResponse(
            200, 
            {playlist}, 
            "Video removed from playlist successfully"
        ));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, "Invalid playlist id");
    }
    if(!req.user || !req.user._id){
        throw new apiError(401, "Unauthorized user");
    }

    const playlist = await Playlist.findOneAndDelete(
        {
            _id: playlistId,
            owner: req.user._id
        }
    );
    if(!playlist){
        throw new apiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new apiResponse(
            200, 
            {}, 
            "Playlist deleted successfully"
        ));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, "Invalid playlist id");
    }
    if(!name){
        throw new apiError(400, "Playlist name is required");
    }
    if(!req.user || !req.user._id){
        throw new apiError(401, "Unauthorized user");
    }

    const playlist = await Playlist.findOneAndUpdate(
        {   
            _id: playlistId,
            owner: req.user._id
        },
        {name, description},
        {new: true}
    );

    if(!playlist){
        throw new apiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new apiResponse(
            200, 
            {playlist}, 
            "Playlist updated successfully"
        ));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}