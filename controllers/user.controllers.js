import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadTocloudinary from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken'
import ms from 'ms'

const cookieOptions = {
    httpOnly : true,
    secure : false,
    maxAge : ms('24h')
}

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

export const loginUser = asyncHandler(async(req,res,next)=>{
    
    const {email,password} = req.body

    if([email,password].some((filed)=>filed.trim()==="")){
        throw new ApiError(400,"Email and password is required")
    }

    const user = await User.findOne({email})
    
    if(!user){
        throw new ApiError(400,"User is not registered, Please signup")
    }

    const checkPassword = await user.isPasswordCorrect(password)

    if(!checkPassword){
        throw new ApiError(400,"Wrong password")
    }


    try{
        const jwtToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        res.cookie('accessToken',jwtToken,cookieOptions)  
        res.cookie('refreshToken',refreshToken,cookieOptions)

        user.refreshToken = refreshToken
        await user.save()
    }
    catch(err){
        throw new ApiError(500,"Something went wrong while login")
    }

    const userResponse = await User.findById(user._id).select("-password -refreshToken")

    res.status(200).json(
        new ApiResponse(200,userResponse,"Loggedin successfully")
    )
})

export const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )
    return res.status(200).clearCookie('accessToken',cookieOptions).clearCookie('refreshToken',cookieOptions).json(
        new ApiResponse(200,"User logged out successfully")
    )
})

export const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unathorized request")
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401,"Invalid refresh token")
    }

    if(incomingRefreshToken!==user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired")
    }
    try{
        const jwtToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save()

        return res.status(200).cookie('accessToken',jwtToken,cookieOptions).cookie('refreshToken',refreshToken,cookieOptions).json(
            new ApiResponse(200,"AccessToken refreshed")
        )
    }
    catch(err){
        throw new ApiError(401,err.message)
    }
})

export const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    if(!oldPassword || !newPassword){
        throw new ApiError(400,"All fields are required")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"Unauthorized user")
    }
    const chekOldPassword = await user.isPasswordCorrect(oldPassword)
    if(!chekOldPassword){
        throw new ApiError(400,"Wrong old password")
    }
    user.password = newPassword
    await user.save()
    res.status(200).json(
        new ApiResponse(200,"Password changed successfully")
    )
})

export const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})

export const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname : fullname,
                email : email
            },
        },
        {new : true}
    ).select("-password -refreshToken")

    if(!user){
        throw new ApiError(401,"Updatation failed")
    }

    return res.status(200).json(
        new ApiResponse(200,user,"Account details updated successfully")
    )
})

export const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar = await uploadTocloudinary(avatarLocalPath)
    if(!avatar.secure_url){
        throw new ApiError(400,"Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.secure_url
            }
        },
        {new : true}
    ).select("-password -refreshToken")
    return res.status(200).json(
        new ApiResponse(200,user,"User avatar updated successfully")
    )
})

export const updateUserCoverPhoto = asyncHandler(async(req,res)=>{
    const coverimageLocalPath = req.file?.path
    if(!coverimageLocalPath){
        throw new ApiError(400,"Coverimage is missing")
    }
    const coverImage = await uploadTocloudinary(coverimageLocalPath)
    if(!coverImage.secure_url){
        throw new ApiError(400,"Error while updating the cover photo")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverimage : coverImage.secure_url
            }
        },
        {new : true}
    ).select("-password -refreshToken")
    return res.status(200).json(
        new ApiResponse(200,user,"User cover image updated successfully")
    )
})