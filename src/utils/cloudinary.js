import { v2 as cloudinary } from "cloudinary";

cloudinary.config({ 
    cloud_name: 'dmcklo4vg', 
    api_key: '976857957156676', 
    api_secret: '<your_api_secret>' // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (fileLocation) => {
    try{    
        if(!fileLocation){
            throw new Error("Please provide a correct file location!");
        }
        const response = await cloudinary.uploader.upload(fileLocation, 
            { resource_type: "auto"});
        
        console.log("file uploaded on cloudinary: ", response.url)
        return response;
    } catch (error){
        fs.unlinkSync(fileLocation); //this helps to remove the file from server
        return null;
    }
}

export { uploadOnCloudinary }