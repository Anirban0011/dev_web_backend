import bcrypt from "bcrypt"
import crypto from "node:crypto"
import mongoose, {Schema} from 'mongoose'
import TokenCreate from '../utils/TokenCreate.js'
import { GH_LOGO } from '../constants.js'

const GithubUserSchema = new Schema({
    username : {type: String,
        default: "",
        required : true},
    ghEmail : {type : String,
        default: "",
        lowercase : true,
        required : true},
    coverimage : {type : String, default: GH_LOGO},
    avatar : {type : String, default: ""},
    masteruser: {type: Boolean, default: false},
    usertype : {
        type : [Boolean],
        default : () => Array(2).fill(false)
    },
    refreshtoken : {type: String},
    otp: {type: String},
    otpExpiry: {type: Date},
    githubToken : {type: String, default:"" },
    starred_repo : {type : [mongoose.Schema.Types.ObjectId]},
    forked_repo : {type : [mongoose.Schema.Types.ObjectId]}
}, { versionKey: false })


GithubUserSchema.methods.genAccessToken = function () {
    return TokenCreate(
        {
            _id: this._id,
            ghEmail : this.ghEmail,
            username: this.username,
        },
        true
)}

GithubUserSchema.methods.genRefreshToken = function () {
    return TokenCreate(
        {
            _id : this._id
        },
        false
)}

GithubUserSchema.methods.genOTP = async function() {
    const otp = crypto.randomInt(100000, 1000000).toString()
    this.otp = await bcrypt.hash(otp, 10)
    this.otpExpiry = Date.now() + 5 * 60 * 1000

    return otp
}

GithubUserSchema.methods.isOTPCorrect = async function (otp) {
    return await bcrypt.compare(otp, this.otp)
}

const GithubUser = mongoose.model('GithubUsers', GithubUserSchema)

export {GithubUser}