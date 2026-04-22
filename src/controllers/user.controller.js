import { User } from "../models/user.model.js"
import AsyncHandler from "../utils/AsyncHandler.js"
import ApiResponse from "../utils/ApiResponse.js"
import ApiError from "../utils/ApiError.js"
import { OK, MODE } from "../constants.js"
import crypto from "node:crypto"
import {v2 as cloudinary} from "cloudinary"
import cloudUpload from "../utils/cloudinary.js"
import {sendResetEmail,
        sendOTPEmail} from "../utils/SendMail.js"

const options = {
        httpOnly: true,
        secure: true,
    }

const genToken = async (userid) => {
        const user = await User.findById(userid)
        const access_token = user.genAccessToken()
        const refresh_token = user.genRefreshToken()
        user.refreshtoken = refresh_token
        await user.save({validateBeforeSave : false})
        return {access_token, refresh_token}
    }

const registerUser = AsyncHandler(async(req, res)=>{

    const {email, username, password} = req.body

    const coverImagePath = req.file?.path

    if(!coverImagePath){
            throw new ApiError(400, "Cover Image is required !")
        }

    const coverImage = await cloudUpload(coverImagePath, `${MODE}/users/normaluser`)

     if(!coverImage){
        throw new ApiError(400, "Image failed to upload on cloudinary")
    }

    console.log("image uploaded")

    const newUser = await User.create({
        coverimage : coverImage.url,
        username : username,
        email : email,
        password : password,
        usertype : [true, false]
    })

    console.log("user created")

    const createdUser = await User.findById(newUser._id).select("-password -ghEmail -refreshtoken")

    if (!createdUser) {
        console.log("user not created")
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    const {access_token, refresh_token} = await genToken(newUser._id)

    return res
    .status(OK)
    .cookie("accesstoken", access_token, options)
    .cookie("refreshtoken", refresh_token, options)
    .json(new ApiResponse(
        OK,
        {
            coverimage : createdUser.coverimage,
            username: createdUser.username,
            email : createdUser.email,
            userExists : true,
            oldUser : false,
            firstload : true,
            masteruser : createdUser.masteruser,
            ghEmail : createdUser.ghEmail,
            usertype : createdUser.usertype,
        },
        "User sign up succes"
    ))
})

const loginUser = AsyncHandler(async(req, res) => {

    const {username, email, password} = req.body

    if(!(email || username)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const pwdvalid = await user.isPasswordCorrect(password)

    if(!pwdvalid){
        throw new ApiError(400, "Invalid credentials")
    }

    const oldUser = await User.findById(user._id).select("-password -refreshtoken")

    const {access_token, refresh_token} = await genToken(oldUser._id)

     return res
    .status(OK)
    .cookie("accesstoken", access_token, options)
    .cookie("refreshtoken", refresh_token, options)
    .json(
        new ApiResponse(
            OK,
            {
                coverimage : oldUser.coverimage,
                username : oldUser.username,
                email : oldUser.email,
                userExists : true,
                oldUser : true,
                firstload : true,
                masteruser : oldUser.masteruser,
                ghEmail : oldUser.ghEmail,
                usertype : oldUser.usertype,
                avatar : oldUser.avatar
            },
            "User logged In Successfully"
        )
    )
})

const getCurrentUser = AsyncHandler( async(req, res) =>{
     return res
    .status(OK)
    .json(new ApiResponse(
        OK,
        {
            coverimage : req.user.coverimage,
            username: req.user.username,
            email : req.user.email,
            userExists : true,
            oldUser : true,
            firstload : false,
            masteruser : req.user.masteruser,
            ghEmail : req.user.ghEmail,
            usertype : req.user.usertype,
            avatar : req.user.avatar
        },
        "User fetched successfully"
    ))
})

const logoutUser = AsyncHandler(async(req, res) => {

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshtoken: 1
                }
            },
            {
                new: true
            }
        )

        return res
        .status(200)
        .clearCookie("accesstoken", options)
        .clearCookie("refreshtoken", options)
        .json(
            new ApiResponse(
                OK,
                {},
                "User logged Out"))

})

const updateCoverImage = AsyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const curUser = await User.findById(req.user._id)
    const oldimgurl = curUser?.coverimage

    if(oldimgurl){
        const parts = oldimgurl.split("/")
        const filename = parts[parts.length - 1].split(".")[0]
        const folder = parts[parts.length - 2] // normaluser
        const parent = parts[parts.length - 3] // users
        const mode = parts[parts.length - 4] // mode
        const fileid = `${mode}/${parent}/${folder}/${filename}`
        const res = await cloudinary.uploader.destroy(fileid)

        if(res.result !== "ok" && res.result !== "not found"){
            throw new ApiError(500, "Failed to delete old cover image")
        }
    }

    const coverImage = await cloudUpload(coverImageLocalPath, `${MODE}/users/normaluser`)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(OK)
    .json(new ApiResponse(OK,
        {user : user},
        "Cover image updated successfully"
    ))
})

const checkUsername = AsyncHandler(async(req, res) =>{

    const username = req.query.username?.trim().toLowerCase()
    if(!username){
        throw new ApiError(400, "Enter valid username")
    }

    let unameExists = await User.findOne({username : username})

    if(!unameExists){
        unameExists = await User.findOne({email : username})
    }

    if(unameExists){
        throw new ApiError(409, "Username/Email already exists")
    }

    return res.status(OK).send()
})

const updatePassword = AsyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(OK)
    .json(
        new ApiResponse
        (OK,
        {},
        "Password changed successfully"
    ))
})

const LinkGithubUser = AsyncHandler(async(req, res)=>{

    const {email, ghEmail, avatar} = req.body

    const curUser = await User.updateOne(
                            {email : email},
                            {$set: {
                                ghEmail: ghEmail,
                                avatar : avatar,
                                "usertype.1" : true }},
                            {strict: false}
                            )
    if(curUser.modifiedCount!==1){
        throw new ApiError(401, "User Github linking failed")
    }
    return res
    .status(OK)
    .json(
        new ApiResponse
        (OK,
        {},
        "Account Linked Succesfully"
        ))
})

const UnLinkGithubUser = AsyncHandler(async(req, res)=>{

    const {email} = req.body

    const curUser = await User.updateOne(
                            {email : email},
                            {$set: { ghEmail: "", avatar : "", "usertype.1" : false }}
                            )
    if(curUser.modifiedCount!==1){
        throw new ApiError(401, "User Github Unlinking failed")
    }
    return res
    .status(OK)
    .json(
        new ApiResponse
        (OK,
        {},
        "Account UnLinked Succesfully"
        ))
})

const SendPwdResetLink = AsyncHandler(async(req, res) =>{
    const {email} = req.body
    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(401, "No such email exists!")
    }

    const token = await user.genResetToken()
    await user.save({ validateBeforeSave: false })

    const resetURL = `${process.env.CORS_ORIGIN}/reset-pwd/${token}`
    await sendResetEmail(user.email, resetURL)

    return res
    .status(OK)
    .json(
        new ApiResponse
        (OK,
        {},
        "Password reset link sent to email"
        ))
})

const VerifyResetTokenExpiry = AsyncHandler(async(req, res)=>{
        const { token } = req.body
        const hashed_token = crypto.createHash("sha256").update(token).digest("hex")
        const user = await User.findOne({
        resetPasswordToken : hashed_token,
        resetPasswordExpiry: { $gt: Date.now() }
    })

     if (!user) {
        throw new ApiError(400, "Token is expired or Invalid!")
    }
     return res
    .status(OK)
    .json(
        new ApiResponse
        (OK,
        {},
        "Token is valid !"
        ))

})

const ResetPassword = AsyncHandler(async(req, res)=>{
    const { token } = req.params
    const { password } = req.body

    const hashed_token = crypto.createHash("sha256").update(token).digest("hex")

    const user = await User.findOne({
        resetPasswordToken : hashed_token,
        resetPasswordExpiry: { $gt: Date.now() }
    })

     if (!user) {
        throw new ApiError(400, "Token is expired !")
    }
    user.password = password
    user.resetPasswordToken = ""
    user.resetPasswordExpiry = ""

    await user.save()

    return res
    .status(OK)
    .json(
        new ApiResponse
        (OK,
        {},
        "Password reset successfully !"
        ))
})

const deleteUser = AsyncHandler(async(req, res)=>{
    const {otp} = req.body
    const userId = req.user?._id
    const user = await User.findById(userId)
     if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
        throw new ApiError(400, "OTP expired!")
    }

    const otpvalid = await user.isOTPCorrect(otp)
    if(!otpvalid){
        throw new ApiError(400, "OTP not valid!")
    }
    const image = user?.coverimage

    if(image){
    const parts = image.split("/")
    const filename = parts[parts.length - 1].split(".")[0]
    const folder = parts[parts.length - 2] // normaluser
    const parent = parts[parts.length - 3] // users
    const mode = parts[parts.length - 4] // mode
    const fileid = `${mode}/${parent}/${folder}/${filename}`
    const res_i = await cloudinary.uploader.destroy(fileid)

    if(res_i.result !== "ok" && res_i.result !== "not found"){
        throw new ApiError(500, "Failed to delete old cover image")
    }
}
    console.log("image deleted")

    await user.deleteOne()
    console.log("user deleted")

    return res
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshtoken", options)
    .json(
    new ApiResponse(
        OK,
        {},
        "Account deleted successfully !"))
})

const SendOTPUser = AsyncHandler(async(req, res)=>{
    const userId = req.user?._id

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found !")
    }
    const otp = await user.genOTP()
    await user.save()
    await sendOTPEmail(user.email, otp)

    return res
    .status(OK)
    .json(
        new ApiResponse
        (OK,
        {},
        "OTP sent to email successfully !"
        ))

})

export {loginUser,
    registerUser,
    getCurrentUser,
    logoutUser,
    updateCoverImage,
    checkUsername,
    updatePassword,
    LinkGithubUser,
    UnLinkGithubUser,
    SendPwdResetLink,
    ResetPassword,
    deleteUser,
    SendOTPUser,
    VerifyResetTokenExpiry
}