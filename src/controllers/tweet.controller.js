import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    try {
        //TODO: create tweet
        const {content} = req.body;
        if (!content) {
            throw new apiError(400, "Content is required")
        }
    
        const tweet = await Tweet.create({
            owner: req.user?._id,
            content
        });
    
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $push: {
                    tweets: tweet._id
                }
            },
            { new: true }
        );
    
        if(!user) {
            throw new apiError(404, "User not found");
        }
    
        return res.status(201) 
        .json(apiResponse(201, tweet, "Tweet created"));
    } catch (error) {
        throw new apiError(500, error.message);
        
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    try {
        // TODO: get user tweets
        const tweets = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user?._id)
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
            },
            {
                $project: {
                    "owner.password": 0,
                    "owner.email": 0,
                    "owner.refreshToken": 0,
                    "owner.watchHistory": 0,
                    "owner.videos": 0
                }
            },
            { 
                $sort: { createdAt: -1 } 
            }
        ]);
    
        return apiResponse(200, tweets, "User tweets retrieved");
    } catch (error) {
        throw new apiError(500, error.message);
    }

})

const updateTweet = asyncHandler(async (req, res) => {
    try {
        //TODO: update tweet
        const {tweetId} = req.params;
        if (!isValidObjectId(tweetId)) {
            throw new apiError(400, "Tweet does not exist");
        }
    
        const { content } = req.body;
        if(!content) {
            throw new apiError(400, "Content is required");
        }
    
        const tweet = await Tweet.findOneAndUpdate(
            { 
                _id: tweetId,
                owner: req.user?._id,
            },
            { $set: { content } },
            {
                new: true
            }
        )
    
        if (!tweet) {
            throw apiError(404, "Tweet not found");
        }
    
        return res.status(200)
        .json(apiResponse(200, tweet, "Tweet updated"));
    } catch (error) {
        throw new apiError(500, error.message);
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    try {
        //TODO: delete tweet
        const {tweetId} = req.params;
        if (!isValidObjectId(tweetId)) {
            throw new apiError(400, "Tweet does not exist");
        }

        const tweet = await Tweet.findOneAndDelete({ 
                _id: tweetId,
                owner: req.user?._id
            });     
        if(!tweet) {
            throw new apiError(404, "Tweet not found");
        }

        await User.findByIdAndUpdate(
            req.user?._id, 
            {
                $pull: {
                    tweets: tweetId
                }
            },
            { new: true }   
        );
    
        return apiResponse(200, {}, "Tweet deleted");
    } catch (error) {
        throw new apiError(500, error.message);
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}