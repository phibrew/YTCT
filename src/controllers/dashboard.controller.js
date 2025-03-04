import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views,
    // total subscribers, total videos, total likes etc.

    const { channelId } = req.params;
    if(!mongoose.isValidObjectId(channelId)){
        throw new apiError(400, "Invalid channel id");
    }

    //counts the total video documents
    const totalVideos = await Video.countDocuments({owner: channelId});
    const totalSubscribers = await Subscription.countDocuments({channel: channelId});
    const totalLikes = await Like.countDocuments({
        contentType: "video",
        contentId: {
            $in: await Video.find({owner: channelId}).distinct("_id")
        }
    });
    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        }
    ])
    
    if(!totalViews.length){
        totalViews.push({totalViews: 0});
    }

    return res.status(200)
    .json(apiResponse(200, {
        totalVideos,
        totalSubscribers,
        totalLikes,
        totalViews: totalViews[0].totalViews
    }));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const { channelId } = req.params;
    if(!mongoose.isValidObjectId(channelId)){
        throw new apiError(400, "Invalid channel id");
    }  

    const videos = await Video.find({owner: channelId})
    .sort({createdAt: -1})  
    .populate("owner", "username avatar coverImage")
    .lean();

    return res.status(200)
    .json(apiResponse(200, videos, "All videos fetched successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }