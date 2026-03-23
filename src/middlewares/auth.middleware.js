import ApiError from "../utils/ApiError.js"
import AsyncHandler from "../utils/AsyncHandler.js"
import { GithubUser } from "../models/githubuser.model.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config({})

// for Github database
const verifyGithubJWT =
    AsyncHandler(async(req, res, next) =>
        {
        let token, decodedToken=null

        token = req.cookies?.gh_accesstoken || req.header("Authorization")?.replace("Bearer ", "")

        if(!token){return res.status(401).send()}
        try{decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)}
        catch{/* */}

        if(!decodedToken){
            token = req.cookies?.gh_refreshtoken
            if(!token){return res.status(401).send()}

            try{decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)}
            catch{/* */}
        }

        const user = await GithubUser.findById(decodedToken?._id).select("-refreshtoken")

        if(!user){
            throw new ApiError(401, "Invalid access token")
        }

        req.user = user
        
        next()
        })

//for normal users
const verifyJWT =
    AsyncHandler(async(req, res, next) =>
        {
        let token, decodedToken=null

        token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "")

        if(!token){return res.status(401).send()}

        try{decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)}
        catch{/**/}

         if(!decodedToken){
            token = req.cookies?.refreshtoken
            if(!token){return res.status(401).send()}

            try{decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)}
            catch{/* */}
        }

        const user = await User.findById(decodedToken?._id).select("-refreshtoken")

        if(!user){
            throw new ApiError(401, "Invalid access token")
        }

        req.user = user

        next()
        })

export {verifyGithubJWT, verifyJWT}