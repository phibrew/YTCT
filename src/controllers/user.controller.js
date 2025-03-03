import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/users.models.js';
import { apiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { apiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = (async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});

        return {accessToken, refreshToken};
    } catch (error) {
        throw new apiError(500, "Something went wrong while generating the tokens!!!")  
    }
})

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

    const avatarLocationPath = req.files?.avatar?.[0]?.path;
    const coverImageLocationPath = req.files?.coverImage?.[0]?.path || "";
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
            avatar: avatar.secure_url,
            coverImage: coverImage?.secure_url || "",
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

const loginUser = asyncHandler(async (req, res) => {
    // to does
    // get the user details like email, user name, password...
    // check for empty fields 
    // check for the user in the database
    // check for the password if correct or not
    // return the access token the user if password is correct
    // redirect the user once logged in  
    const {email, username, password} = req.body; 
    // console.log("email: ", email);
    if(!email && !username){
        throw new apiError(400, "Email or username is required!!!");
    }    

    const user = await User.findOne({
        $or: [{email}, {username}]
    });

    if(!user){
        throw new apiError(404, "User does not exist!!!");
    }

    if(!password){
        throw new apiError(400, "Password is required!!!");
    }

    if(!await user.verifyPassword(password)){
        throw new apiError(401, "Invalid password!!!");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

    const options = {
        //this lets only server to modify the cookies, else without it anyone can modify it.
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200, {
            loggedInUser,
            accessToken,
            refreshToken
            }, 
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: { refereshToken: undefined }
        },
        { new: true}
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)   
    .json(new apiResponse(200, {}, "User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken ||
        req.body.refreshToken;
    
        if(!incomingRefreshToken){
            throw new apiError(401, "Unauthorized request!!!");
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?.id)
        if(!user){
            throw new apiError(401, "Invalid Refresh Token!!");
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new apiError(401, "Expired or Used Refresh Token!!!");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {newAccessToken, newRefreshToken} = 
        await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new apiResponse(
                200, 
                {newAccessToken, newRefreshToken}, 
                "Access Token Refreshed Successfully"
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || "Unauthorized Request!!!");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    if(!oldPassword || !newPassword){
        throw new apiError(400, "Old and New Passwords are required!!!");
    }
    const user = await User.findById(req.user?._id);
    const isMatch = await user.verifyPassword(oldPassword);
    if(!isMatch){
        throw new apiError(401, "Invalid Old Password!!!");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));

})

const getUserProfile = asyncHandler(async (req, res) => {
    return res.status(200)
    .json(new apiResponse(200, req.user, "User profile fetched successfully"));
})

const updateUserAccount = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new apiError(400, "Full Name and Email are required!!!");
    }   

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true}
    ).select("-password -refreshToken");

    return res.status(200)
    .json(new apiResponse(200, user, "User account updated successfully"));

})   

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocationPath = req.file?.avatar?.[0]?.path;
    if(!avatarLocationPath){
        throw new apiError(400, "Avatar file is missing!!!");
    }
    //storing old avatar image from cloudinary url
    const oldAvatar = req.user?.avatar;

    const avatar = await uploadOnCloudinary(avatarLocationPath);
    if(!avatar.url){
        throw new apiError(400, "Error while uploading avatar!!");
    }

    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true}
    ).select("-password -refreshToken");
    
    //deleting old avatar from cloudinary


    return res.status(200)
    .json(new apiResponse(200, user, "User avatar updated successfully"));
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocationPath = req.file?.avatar?.[0]?.path;
    if(!coverImageLocationPath){
        throw new apiError(400, "CoverImage file is missing!!!");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocationPath);
    if(!coverImage.url){
        throw new apiError(400, "Error while uploading CoverImage!!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true}
    ).select("-password -refreshToken");

    return res.status(200)
    .json(new apiResponse(200, user, "User CoverImage updated successfully"));
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params;

    if(!username?.trim()){
        throw new apiError(400, "Username is required.");
    }

    const channel = User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
            
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",  
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",  
                foreignField: "channel",
                as: "subsribers"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false 
                    }
                }
            }
        },
        {
            $project:{
                password: 0,
                refreshToken: 0,
            }
        }
    ]);

    if(!channel?.length){
        throw new apiError(404, "Channel not found.");
    }
    console.log(channel);

    return res.status(200)
    .json(new apiResponse(200, "Channel profile fetched successfully.", channel[0]));
})

const getWatchHistory = asyncHandler(async (req, res) => {
    //req.user._id return string by default in mongo db

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
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
                                    fullName: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        $first: "$owner"
                    }
                }
            ]
            }
        }
    ])

    return res.status(200)
    .json(new apiResponse(200, "Watch history fetched successfully.", user[0].watchHistory));
})

export { registerUser, 
    loginUser, logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getUserProfile,
    updateUserAccount,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};        