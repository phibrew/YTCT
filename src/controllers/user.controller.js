import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/users.models.js';
import { apiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { apiResponse } from '../utils/apiResponse.js';

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

export { registerUser, loginUser, logoutUser };        