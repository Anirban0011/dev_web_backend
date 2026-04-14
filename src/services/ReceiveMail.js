import {Resend} from "resend"
import { MAIL_ID } from "../constants.js"
const resend = new Resend(process.env.RESEND_API_KEY)

const forwardMail = async(payload)=>{
    const emailid = payload?.email_id
    const {data : received, error} = await resend.emails.receiving.get(emailid)

    if (error) {
        console.error("Error fetching email:", error)
        return
    }

    let contentHtml = "<p><em>No content</em></p>"

    if (received.html && received.html.trim()) {
        contentHtml = received.html;
    } else if (received.text && received.text.trim()) {
        contentHtml = `<div style="white-space: pre-wrap;">${received.text.replace(/\n/g, '<br>')}</div>`
    }

    await resend.emails.send({
        from: "Anirban Builds <contact@anirbanbuilds.online>",
        to : MAIL_ID,
        subject : `${received.subject || payload.subject} || New Message`,
        html: `
        <div style="font-family:sans-serif;line-height:1.6;">
            <hr/>
            <p><strong>From:</strong> ${received.from}</p>
            <p>${contentHtml}</p>
        </div>
        `
    })
}

export {forwardMail}