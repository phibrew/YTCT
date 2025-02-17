import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/users.models.js";
import jwt from "jsonwebtoken";
//this will verify if user exists or not

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || 
        req.headers("authorization")?.replace("Bearer ", "");
    
        if(!token){
            throw new apiError(401, "Unauthorized access!!!");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new apiError(401, "Invalid access token!!!");
        }
        //addiing the object to the request object
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, error?.message || "Unauthorized access!!!");
    }
})