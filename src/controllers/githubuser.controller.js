import AsyncHandler from "../utils/AsyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {GithubUser} from "../models/githubuser.model.js"
import { OK } from "../constants.js"
import { sendOTPEmail } from "../utils/SendMail.js"

const options = {
        httpOnly: true,
        secure: true,
    }

const genToken = async (userid) => {
        const user = await GithubUser.findById(userid)
        const access_token = user.genAccessToken()
        const refresh_token = user.genRefreshToken()
        user.refreshtoken = refresh_token
        await user.save({validateBeforeSave : false})
        return {access_token, refresh_token}
    }

const GithubLogin = AsyncHandler(async (req, res) => {
    const code = req.query.code
    if(!code){
        throw new ApiError(400, "Code not provided !")
    }

    const payload = {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
}

const params = "?client_id=" + payload.client_id +
                "&client_secret=" + payload.client_secret +
                "&code=" + payload.code

    const tokenReq = await fetch(
        'https://github.com/login/oauth/access_token' + params,
        {
            method : "POST",
            headers : {
                "Accept" : "application/json"
            }
        }
    )

    const tokenData = await tokenReq.json()
    const token = tokenData.access_token
    const userRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${token}` }
})
    const userData = await userRes.json()
    const emailsRes = await fetch('https://api.github.com/user/emails', {
                        headers: { Authorization: `token ${token}` }
})
    const githubEmails = await emailsRes.json()
    const githubEmail = (githubEmails.find(e => e.primary) || githubEmails[0]).email

    if(!githubEmail){
        throw new ApiError(500, "No valid Github Email found")
    }

    const userExists = await GithubUser.findOne({ghEmail: githubEmail})

    // first time user
    if(!userExists){

        const newUser = await GithubUser.create({
            username : userData.login,
            ghEmail : githubEmail,
            avatar : userData.avatar_url,
            usertype : [false, true]
        })

        const createdUser = await GithubUser.findById(newUser._id).select("-refreshtoken")

        if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    const {access_token, refresh_token} = await genToken(newUser._id)

    console.log("github user created")

    return res
    .status(OK)
    .cookie("gh_accesstoken", access_token, options)
    .cookie("gh_refreshtoken", refresh_token, options)
    .json(new ApiResponse(
        OK,
        {
            username: createdUser.username,
            ghEmail : createdUser.ghEmail,
            avatar : createdUser.avatar,
            masteruser : createdUser.masteruser,
            coverimage : createdUser.coverimage,
            userExists : true,
            oldUser : false,
            firstload : true,
            usertype : createdUser.usertype,
        },
        "Github user sign up success"
    ))
}

    // already github logged
    else{
    const oldUser = await GithubUser.findById(userExists._id).select("-refreshtoken")
    const {access_token, refresh_token} = await genToken(oldUser._id)

    return res
    .status(OK)
    .cookie("gh_accesstoken", access_token, options)
    .cookie("gh_refreshtoken", refresh_token, options)
    .json(new ApiResponse(
        OK,
        {
            username: oldUser.username,
            ghEmail : oldUser.ghEmail,
            avatar : oldUser.avatar,
            masteruser : oldUser.masteruser,
            coverimage : oldUser.coverimage,
            oldUser : true,
            userExists : true,
            firstload : true,
            usertype : oldUser.usertype,
        },
        "Github login success"
    ))
}
})

const GithubCurrentUser = AsyncHandler(async(req, res) =>{
     return res
    .status(OK)
    .json(new ApiResponse(
        OK,
        {
            username: req.user.username,
            ghEmail : req.user.ghEmail,
            avatar : req.user.avatar,
            masteruser : req.user.masteruser,
            coverimage : req.user.coverimage,
            userExists : true,
            oldUser : true,
            githubuser : true,
            firstload : false,
            usertype : req.user.usertype,
        },
        "User fetched successfully"
    ))
})

const LogoutGithubUser = AsyncHandler(async(req, res) => {

        await GithubUser.findByIdAndUpdate(
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
        .clearCookie("gh_accesstoken", options)
        .clearCookie("gh_refreshtoken", options)
        .json(
            new ApiResponse(
                OK,
                {},
                "Github User logged Out"))

})

const deleteGithubUser = AsyncHandler(async(req, res)=>{
    const {otp} = req.body
    const userId = req.user?._id
    const user = await GithubUser.findById(userId)
     if (!user) {
        throw new ApiError(404, "Github User not found")
    }

    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
        throw new ApiError(400, "OTP expired!")
    }

    const otpvalid = await user.isOTPCorrect(otp)
    if(!otpvalid){
        throw new ApiError(400, "OTP not valid")
    }

    await user.deleteOne()
    console.log("github user deleted")

    return res
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshtoken", options)
    .json(
    new ApiResponse(
        OK,
        {},
        "Github account deleted successfully !"))
})

const SendOTPGithubUser = AsyncHandler(async(req, res)=>{
    const userId = req.user?._id
    const user = await GithubUser.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found !")
    }
    const otp = await user.genOTP()
    await user.save()
    await sendOTPEmail(user.ghEmail, otp)

    return res
    .status(OK)
    .json(
        new ApiResponse
        (OK,
        {},
        "OTP sent to email successfully !"
        ))
})

export {GithubLogin,
        GithubCurrentUser,
        LogoutGithubUser,
        deleteGithubUser,
        SendOTPGithubUser}