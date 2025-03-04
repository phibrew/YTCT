import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const {channelId} = req.params
        // TODO: toggle subscription 
        const {subscriberId} = req.user
        if(!isValidObjectId(channelId)){
            throw new apiError(400, "Invalid channel id")
        }
        if(!isValidObjectId(subscriberId)){
            throw new apiError(400, "Invalid subscriber id")
        }
    
        const ifSubscribed = await Subscription.findOne({
            subscriber: subscriberId,
            channel: channelId
        });
    
        if(ifSubscribed){
            await Subscription.deleteOne({
                subscriber: subscriberId,
                channel: channelId  
            });
            return res.status(200)
            .json(new apiResponse(200, null,"Unsubscribed successfully"));
        } else{
            const newSubscriber = Subscription.create({
                subscriber: subscriberId,
                channel: channelId
            })
            return res.status(200)
            .json(new apiResponse(200, newSubscriber, "Subscribed successfully"));
        }
    } catch (error) {
        return next(new apiError(500, error.message));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const {channelId} = req.params;
        if(!isValidObjectId(channelId)){
            throw new apiError(400, "Invalid channel id");
        }
        const subscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriber"
                }
            },
            {
                $unwind: "$subscriber"
            },
            {
                $project: {
                    "$subscriber._id": 1,
                    "$subscriber.username": 1,
                    "$subscriber.email": 1,
                    "$subscriber.avatar": 1
                }
            },
        ]).exec();
    
        if(!subscribers.length){
            throw new apiError(404, "No subscribers found");
        }
    
        return res.status(200)
        .json(new apiResponse(200, subscribers, "Subscribers found"));
    } catch (error) {
        return next(new apiError(500, error.message));
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const { subscriberId } = req.params;
        if(!isValidObjectId(subscriberId)){
            throw new apiError(400, "Invalid subscriber id")
        }
    
        const channels = await Subscription.aggregate([
            {
                $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channel"
                }
            },
            {
                $unwind: "$channel"
            },
            {
                $project: {
                    "$channel._id": 1,
                    "$channel.username": 1,
                    "$channel.avatar": 1,
                    "$channel.coverImage": 1
                }
            }
        ]).exec();
    
        if(!channels.length){
            throw new apiError(404, "No subscribed channels found");
        }
    
        return res.status(200)
        .json(new apiResponse(200, channels, "Subscribed channels found"));
    } catch (error) {
        return next(new apiError(500, error.message));
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}