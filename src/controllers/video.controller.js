import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/videos.models.js';
import { User } from '../models/users.models.js';
import { apiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { apiResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';


const publishAVideo = asyncHandler(async(req, res) => {
    try {
        const {title, description, thumbnail} = req.body;
        
        //check if none field is empty
        if(!title || !description || !thumbnail){
            throw new apiError(400, "All fields are required");
        }
    
        // get the video file from the req
        const videoFile = req.file?.path;
        if(!videoFile){
            throw new apiError(400, "Video file is required");
        }
    
        // upload on cloudinary
        const videoFileOnCloudinary = await uploadOnCloudinary(videoFile);
        if(!videoFileOnCloudinary){
            throw new apiError(500, "Error uploading video file");
        }
    
        // create the video in the database
        const newVideo = await Video.create({
            videoFile: videoFileOnCloudinary.secure_url,
            thumbnail,
            title,
            description,
            duration: videoFileOnCloudinary.duration,
            owner: req.user._id
        });
    
        // add the video to the user's video collection
        const user = await User.findByIdAndUpdate(req.user._id, {
            $push: {
                videos: newVideo._id
            }
        });
    
        return res.status(201)
        .json(new apiResponse(201, newVideo, "Video published successfully"));
    } catch (error) {
        throw new apiError(500, error.message);
    }
})

const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const {sortBy, sortType, query, page=1, limit=10, userId} = req.query;

        const filter = {};
        if(userId){ filter.owner = userId;}

        if(query){
            filter.title = {
                $regex: query,
                $options: "i" // ignores case sensitivity
            }
        }
        
        //options is used parameter to paginate the results 
        const options = {
            page: parseInt(page), 
            limit: parseInt(limit),
            sort: {
                //in mongodb asc is 1 and desc is -1,
                [sortBy]: sortType === "desc" ? -1 : 1
            }
        }

        const videos = await Video.paginate(filter, options);
        return req.status(200)
        .json(new apiResponse(200, videos, "Videos fetched successfully"));

    } catch (error) {
        throw new apiError(500, error.message);
    }
})

const getVideosById = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params;
        if(!mongoose.isValidObjectId(videoId)){
            throw new apiError(400, "Invalid video id");
        }

        await Video.findByIdAndUpdate(videoId, {
            $inc: {
                views: 1
            }
        })
        const video = await Video.aggregate(
            [   
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(videoId)
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
                    $unwind: "$owner"
                    //converts the owner array to object
                },
                {
                    $project: {
                        "owner.password": 0,
                        "owner.email": 0,
                        "owner.refreshToken": 0
                    }
                }
            ]
        )
        if(!video.length){
            throw new apiError(404, "Video not found");
        }

        return res.status(200)
        .json(
            new apiResponse(200, video, "Video fetched successfully")
        );

    } catch (error) {
        throw new apiError(500, error.message);
    }

})

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params;
        if(!mongoose.isValidObjectId(videoId)){
            throw new apiError(400, "Invalid video id");
        }

        //to update the video details only
        const {title, description, thumbnail} = req.body;
        const update = {};

        if(title){ update.title = title;}
        if(description){ update.description = description;}
        if(thumbnail){ update.thumbnail = thumbnail;}

        const video = await Video.findByIdAndUpdate(
            videoId, 
            update, {
                new: true
            }
        );

        if(!video){
            throw new apiError(404, "Video not found");
        }

        return res.status(200)
        .json(new apiResponse(200, video, "Video updated successfully"));

    } catch (error) {
        throw new apiError(500, error.message);
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params;
        if(!mongoose.isValidObjectId(videoId)){
            throw new apiError(400, "Invalid video id");
        }

        const video = await Video.findByIdAndDelete(videoId);
        if(!video){
            throw new apiError(404, "Video not found");
        }

        //remove the video from the user's video collection
        await User.findByIdAndUpdate(video.owner, {
            $pull: {
                videos: videoId
            }
        });

        return res.status(200)
        .json(new apiResponse(200, null, "Video deleted successfully"));
    } catch (error) {
        throw new apiError(500, error.message);      
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params;
        if(!mongoose.isValidObjectId(videoId)){
            throw new apiError(400, "Invalid video id");
        }

        const video = await Video.findByIdAndUpdate(videoId, {
            $set: {
                isPublished: !video.isPublished
            },
            new: true
        });

        if(!video){
            throw new apiError(404, "Video not found");
        }

        return res.status(200)
        .json(new apiResponse
            (
                200, 
                video,
                "Video publish status updated successfully"
            )
        );
    } catch (error) {
        throw new apiError(500, error.message);        
    }
})

export {
    publishAVideo,
    getAllVideos,
    getVideosById,
    updateVideo,    
    deleteVideo,
    togglePublishStatus
}