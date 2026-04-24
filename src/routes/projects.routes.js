import { Router} from "express"
import {
    Addproject,
    Getprojects,
    GetprojTitles,
    Deleteproject} from "../controllers/project.controller.js"
import { verifyAnyJWT } from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const projectRouter = Router()

projectRouter.route('/addproject').post(verifyAnyJWT, upload.single("projImage"), Addproject)
projectRouter.route('/fetchproject').get(Getprojects)
projectRouter.route('/fetch-titles').get(GetprojTitles)
projectRouter.route('/delete-project').delete(verifyAnyJWT, Deleteproject)
export default projectRouter