import { Router } from "express"
import {
    GithubLogin,
    GithubCurrentUser,
    LogoutGithubUser,
    deleteGithubUser,
    SendOTPGithubUser,
    StarRepoGithubUser,
    ForkRepoGithubUser } from "../controllers/githubuser.controller.js"
import {
    loginUser,
    registerUser,
    logoutUser,
    getCurrentUser,
    checkUsername,
    updatePassword,
    updateCoverImage,
    LinkGithubUser,
    UnLinkGithubUser,
    SendPwdResetLink,
    ResetPassword,
    deleteUser,
    SendOTPUser,
    VerifyResetTokenExpiry
    } from "../controllers/user.controller.js"
import { verifyGithubJWT, verifyJWT, verifyAnyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
const UserRouter = Router()

//routes
UserRouter.route('/gh-login').get(GithubLogin)
UserRouter.route('/gh-users').get(verifyGithubJWT, GithubCurrentUser)
UserRouter.route('/gh-logout').get(verifyGithubJWT, LogoutGithubUser)
UserRouter.route('/gh-link').patch(verifyJWT, LinkGithubUser)
UserRouter.route('/gh-unlink').patch(verifyJWT, UnLinkGithubUser)
UserRouter.route('/login').post(loginUser)
UserRouter.route('/signup').post(upload.single("coverimage"), registerUser)
UserRouter.route('/logout').get(verifyJWT, logoutUser)
UserRouter.route('/users').get(verifyJWT, getCurrentUser)
UserRouter.route('/check-uname').get(checkUsername)
UserRouter.route('/update-pwd').patch(verifyJWT, updatePassword)
UserRouter.route('/forgot-pwd').post(SendPwdResetLink)
UserRouter.route('/reset-pwd/:token').post(ResetPassword)
UserRouter.route('/delete-user').delete(verifyJWT, deleteUser)
UserRouter.route('/delete-ghuser').delete(verifyGithubJWT, deleteGithubUser)
UserRouter.route('/usr-otp').post(verifyJWT, SendOTPUser)
UserRouter.route('/ghusr-otp').post(verifyGithubJWT, SendOTPGithubUser)
UserRouter.route('/verify-token').post(VerifyResetTokenExpiry)
UserRouter.route('/update-cover-image').patch(verifyJWT, upload.single("coverimage"), updateCoverImage)
UserRouter.route('/star-repo').post(verifyAnyJWT, StarRepoGithubUser)
UserRouter.route('/fork-repo').post(verifyAnyJWT, ForkRepoGithubUser)

export default UserRouter