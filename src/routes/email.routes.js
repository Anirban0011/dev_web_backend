import { Router } from "express"
import { handleInboxMail } from "../controllers/email.controller.js"

const emailRouter = Router()

emailRouter.route('/send-email').post(handleInboxMail)
export default emailRouter