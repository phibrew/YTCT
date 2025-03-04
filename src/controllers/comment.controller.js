import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    try {
        //TODO: get all comments for a video
        const {videoId} = req.params;
        const {sortBy = "createdAt", page = 1, limit = 10} = req.query;
    
        if(!mongoose.isValidObjectId(videoId)) {
            throw new apiError(400, "Invalid video id");
        }
    
        const filter = await Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                                createdAt: 1
                            }
                        },
                    ]
                }
            },
            { $unwind: "$owner" },
            {
                $sort: { [sortBy]: -1 }
            },

            {
                $facet: {
                    metadata: [{
                        $count: "totalDocs"
                    }, {
                        $addFields: {
                            page: parseInt(page),
                            limit: parseInt(limit)
                        }
                    }],
                    data: [
                        { $skip: (page - 1) * limit},
                        { $limit: parseInt(limit)}
                    ]
                }
            }
        ]);
        
        const {metadata, data} = filter[0];
        const comments = metadata.length > 0 ? metadata[0] : {
            totalDocs: 0, page, limit
        }
        // without facet its way easier, with it the representation
        // gets to a bit more detailed for the front end
        // easy to understand as well what page, limit, etc done
        if(!data.length) {
            throw new apiError(404, "No comments found");  
        }
    
        return res.status(200)
        .json(apiResponse(200, { ...comments, docs: data}, "Comments retrieved successfully"));
        
    
    } catch (error) {
        throw new apiError(500, error.message);
    }
})

const addComment = asyncHandler(async (req, res) => {
    try {
        // TODO: add a comment to a video
        const { content } = req.body;
        const { videoId } = req.params;
        if(!content?.trim()) {
            throw new apiError(400, "Content is required");
        }   
        if(!mongoose.isValidObjectId(videoId)) {
            throw new apiError(400, "Invalid video id");
        }
    
        const comment = await Comment.create({
            content,
            video: videoId,
            owner: req.user._id
        });
    
        return res.status(201)
        .json(apiResponse(201, comment, "Comment added successfully"));
    } catch (error) {
        throw new apiError(500, error.message);
        
    }
})

const updateComment = asyncHandler(async (req, res) => {
    try {
        // TODO: update a comment
        const { content } = req.body;
        const { commentId, videoId } = req.params;
        if(!content?.trim()) {
            throw new apiError(400, "Content is required");
        }
        if(!mongoose.isValidObjectId(commentId) ||
        !mongoose.isValidObjectId(videoId)) {
            throw new apiError(400, "Invalid comment id or video id");
        }
    
        const comment = await Comment.findOneAndUpdate({
            _id: commentId,
            owner: req.user._id,
            video: videoId
        }, { $set: {content} }, { new: true });
    
        if(!comment) {
            throw new apiError(404, "Comment not found");
        }
    
        return res.status(200)
        .json(apiResponse(200, comment, "Comment updated successfully"));
    } catch (error) {
        throw new apiError(500, error.message);
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    try {
        // TODO: delete a comment
        const { commentId, videoId } = req.params;
        if(!mongoose.isValidObjectId(commentId) ||
        !mongoose.isValidObjectId(videoId)) {
            throw new apiError(400, "Invalid comment id or video id");
        }
    
        const comment = await Comment.findOneAndDelete({
            _id: commentId,
            owner: req.user._id,
            video: videoId
        });
    
        if(!comment) {
            throw new apiError(404, "Comment not found");
        }
    
        return res.status(200)
        .json(apiResponse(200, null, "Comment deleted successfully"));
    } catch (error) {
        throw new apiError(500, error.message);
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}