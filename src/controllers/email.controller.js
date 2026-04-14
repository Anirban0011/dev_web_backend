import { forwardMail } from "../services/ReceiveMail.js"
import Asynchandler from "../utils/AsyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { OK } from "../constants.js"

const handleInboxMail = Asynchandler(async(req, res)=>{
     const { data } = req.body
     console.log(data)
     const { from, subject, text } = data || {}
    if (!from) {
    throw new ApiError(400, "Missing sender email")
    }
    await forwardMail({ from, subject, text : text || "" })

    return res
        .status(OK)
        .json(
            new ApiResponse
            (OK,
            {},
            "Email forwarded successfully !"
            ))

})

export {handleInboxMail}