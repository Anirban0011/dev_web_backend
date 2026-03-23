import { User } from "../models/user.model.js"
import AsyncHandler from "../utils/AsyncHandler.js"
import ApiResponse from "../utils/ApiResponse.js"
import ApiError from "../utils/ApiError.js"
import { OK } from "../constants.js"
import {v2 as cloudinary} from "cloudinary"
import cloudUpload from "../utils/cloudinary.js"

const options = {
        httpOnly: true,
        secure: true,
        sameSite : "none",
        domain: ".anirbanbuilds.online"
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

    const coverImage = await cloudUpload(coverImagePath, "users/normaluser")

     if(!coverImage){
        throw new ApiError(400, "Image failed to upload on cloudinary")
    }

    console.log("image uploaded")

    const newUser = await User.create({
        coverimage : coverImage.url,
        username : username,
        email : email,
        password : password
    })

    console.log("user created")

    const createdUser = await User.findById(newUser._id).select("-password -ghEmail -refreshtoken")

    if (!createdUser) {
        console.log("user not created")
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    const setusertype = await User.updateOne(
        {_id : newUser._id},
        {$set : {"usertype.0" : true}}
    )

    if (!setusertype) {
        console.log("user not created")
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    const updatedUser = await User.findById(newUser._id).select("-password -email -refreshtoken")

    const {access_token, refresh_token} = await genToken(newUser._id)

    return res
    .status(OK)
    .cookie("accesstoken", access_token, options)
    .cookie("refreshtoken", refresh_token, options)
    .json(new ApiResponse(
        OK,
        {
            coverimage : newUser.coverimage,
            username: newUser.username,
            email : newUser.email,
            userExists : true,
            oldUser : false,
            firstload : true,
            masteruser : newUser.masteruser,
            ghEmail : newUser.ghEmail,
            usertype : updatedUser.usertype,
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
const   parent = parts[parts.length - 3] // users

const   fileid = `${parent}/${folder}/${filename}`
        const res = await cloudinary.uploader.destroy(fileid)

        if(res.result !== "ok" && res.result !== "not found"){
            throw new ApiError(500, "Failed to delete old cover image")
        }
    }

    const coverImage = await cloudUpload(coverImageLocalPath, "users/normaluser")

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

export {loginUser,
    registerUser,
    getCurrentUser,
    logoutUser,
    updateCoverImage,
    checkUsername,
    updatePassword,
    LinkGithubUser,
    UnLinkGithubUser
}