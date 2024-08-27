import { Router } from "express";
import { loginUser, registerUser , logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverPhoto} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import isLoggedIn from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
  registerUser
);

userRouter.route("/login").post(loginUser);
userRouter.route('/logout').get(isLoggedIn,logoutUser)
userRouter.route('/refresh-token').post(refreshAccessToken)
userRouter.route('/change-password').post(isLoggedIn,changeCurrentPassword)
userRouter.route('/me').get(isLoggedIn,getCurrentUser)
userRouter.route('/update-account').post(isLoggedIn,updateAccountDetails)
userRouter.route('/update-avatar').put(isLoggedIn,updateUserAvatar)
userRouter.route('/update-coverimage').put(isLoggedIn,updateUserCoverPhoto)

export default userRouter;
