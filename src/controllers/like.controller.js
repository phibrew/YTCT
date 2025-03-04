import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {apiError} from "../utils/apiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleLike = asyncHandler(async (req, res) => {
    const { contentId } = req.params;
    const { contentType } = req.body;
    //TODO: toggle like on video
    if(!isValidObjectId(contentId)){
        throw new apiError("Invalid content id");
    }
    if(!req.user || !req.user._id){
        throw new apiError("Unauthorized user", 401);
    }
    if(!["video", "tweet", "comment"].includes(contentType)){
        throw new apiError("Invalid content type", 400);
    }

    const like = await Like.findOne({
        owner: req.user._id,
        contentId,
        contentType
    });

    if(!like){  
        const liked = await Like.create({
            owner: req.user._id,
            contentId,
            contentType
        }); 
        return res.status(200)
        .json(apiResponse(200, liked, `${contentType} liked`));
    } else{
        await Like.deleteOne({_id: like._id});
        return res.status(200)
        .json(apiResponse(200, null, `${contentType} unliked`));
    }
})


const getLikedContent = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    if(!req.user || !req.user._id){
        throw new apiError("Unauthorized", 401);
    }

    const liked = await Like.find({owner: req.user._id}).lean();

    if(!liked){
        throw new apiError("No liked videos found");
    }
    const likedContent = await Promise.all(liked.map(async like => {
        const content = await mongoose.model(like.contentType)
        .findById(like.contentId);
        return { type: like.contentType, content };
    }))
    return res.status(200)
    .json(apiResponse(200, likedContent, "Liked content retrieved"));
})

export {
    toggleLike,
    getLikedContent
}