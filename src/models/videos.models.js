import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema({
    id: {
        type: String,
        unique: true
    },
    videoFile: {
        type: String, //cloudinary url
        required: true
    },
    tumbnail: {
        type: String,
        required: true,
        index: true
    },
    owner: {
        type: Schema.types.ObjectId,
        ref: "User"
    },
    title: {
        type: String
    },
    description:{
        type: String
    },
    duration: {
        type: Number,//cloudinary url
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: true
    }


}, {timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate);  

export const Video = mongoose.model('Video', videoSchema);