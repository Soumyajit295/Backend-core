import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadTocloudinary from "../utils/cloudinary.js";

export const registerUser = asyncHandler(async(req,res,next)=>{
    const {fullname,email,username,password} = req.body

    if([fullname,email,username,password].some((filed)=>filed.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{email},{username}]
    })

    if(existedUser){
        throw new ApiError(400,"Username or email is already exists")
    }

    const avatarLocalPath = req.files['avatar']?.[0]?.path
    const coverimageLocalPath = req.files['coverimage']?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }

    let avatar,coverimage

    try{
        avatar = await uploadTocloudinary(avatarLocalPath)
        if(!avatar){
            throw new ApiError(500,"There is some problem with upload the avatar")
        }
        if(coverimageLocalPath){
            coverimage = await uploadTocloudinary(coverimageLocalPath)
        }
    }
    catch(err){
        throw new ApiError(500,"Error while uploading images")
    }

    const user = await User.create({
        fullname,
        email,
        username,
        password,
        avatar : avatar.secure_url,
        coverimage : coverimage?.secure_url || null
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"Registration failed,please try again")
    }
    
    res.status(200).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})