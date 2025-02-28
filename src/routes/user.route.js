import { Router } from 'express';
import { registerUser, loginUser, logoutUser, 
    refreshAccessToken, changeCurrentPassword, getUserProfile,
    updateUserAccount, updateUserAvatar, updateUserCoverImage,
    getUserChannelProfile, getWatchHistory
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(
    // used for the images and the stuff uploaded through cloudinary
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}  
    ]),
    registerUser);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getUserProfile);
router.route("/update-account").patch(verifyJWT, updateUserAccount);//post change everything
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.singel("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router