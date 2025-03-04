import mongoose, { Schema } from 'mongoose';

const likeSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    contentId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
        enum: ["video", "tweet", "comment"]
    },
}, {timestamps: true})

export const Like = mongoose.model("Like", likeSchema);