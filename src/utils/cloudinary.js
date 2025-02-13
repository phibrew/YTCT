import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (fileLocation) => {
    try{    
        if(!fileLocation){
            throw new Error("Please provide a correct file location!");
        }
        const response = await cloudinary.uploader.upload(fileLocation, 
            { resource_type: "auto"});
        
        // console.log("file uploaded on cloudinary: ", response.url)
        fs.unlinkSync(fileLocation);
        return response;
    } catch (error){
        fs.unlinkSync(fileLocation); //this helps to remove the file from server
        return null;
    }
}

export { uploadOnCloudinary }