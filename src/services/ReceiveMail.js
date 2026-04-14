import {Resend} from "resend"
import { MAIL_ID } from "../constants.js"
const resend = new Resend(process.env.RESEND_API_KEY)

const forwardMail = async({from, subject, text})=>{
    await resend.emails.send({
        from: "Anirban Builds <contact@anirbanbuilds.online>",
        to : MAIL_ID,
        sub : `email from ${from}`,
        html: `
        <div style="font-family:sans-serif;">
            <h2>New Incoming Email</h2>
            <p><strong>From:</strong> ${from}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr/>
            <p>${text}</p>
        </div>
        `
    })
}

export {forwardMail}