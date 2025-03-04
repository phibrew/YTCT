import mongoose, { Schema } from 'mongoose';

const playListSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timeStamps: true});

export const Playlist = mongoose.model('Playlist', playListSchema);