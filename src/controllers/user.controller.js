import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/users.models.js';
import { apiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { apiResponse } from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "User registered successfully",
    // });

    // get the user details 
    // verify the details for empty fields or existed user
    // upload the files to the server
    // create the user in database
    // save the details to the database
    // return the response

    const {fullName, email, username, password} = req.body;
    // console.log("email: ", email);

    if(
        [fullName, email, username, password].some((field) => field?.trim() ==="")
    ){
        throw new apiError(400, "All of the fields are required!!!");
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    });

    if(existedUser){
        throw new apiError(409, "User already exists with this email or username!!!")
    }

    const avatarLocationPath = req.files?.avatar[0]?.path;
    const coverImageLocationPath = req.files?.coverImage[0]?.path;

    if(!avatarLocationPath){
        throw new apiError(400, "Avatar is required!!!");
    }

    const avatar = await uploadOnCloudinary(avatarLocationPath);

    if(!avatar){
        throw new apiError(400, "Avatar is required!!!");
    }
    
    const coverImage = await uploadOnCloudinary(coverImageLocationPath);

    const user = await User.create(
        {
            fullName,
            email, 
            username: username.toLowerCase(),
            password, 
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        }
    )

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new apiError(500, "Something went wrong while registering the user.");
    }

    return res.status(201).json(
        new apiResponse(201, createdUser, "User registered successfully")
    )
})

export { registerUser };        