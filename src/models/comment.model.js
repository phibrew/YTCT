import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new Schema(
    {
        content: {
        type: String,
        },
        video: {
            type: Schem.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {timeStamps: true}
)

commentSchema.plugin(mongooseAggregatePaginate);
export const comment = mongoose.model('Comment', commentSchema);
