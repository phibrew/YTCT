import mongoose, { Schema } from 'mongoose';

const likeSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
}, {timeStamps: true})

export const Like = mongoose.mode("Like", likeSchema);