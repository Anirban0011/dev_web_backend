import {Resend} from "resend"
import { MAIL_ID } from "../constants.js"
const resend = new Resend(process.env.RESEND_API_KEY)

const forwardMail = async(payload)=>{
    const emailid = payload?.email_id
    const {data : received} = await resend.emails.receiving.get(emailid)

    const contentHtml = received.html || `<div style="white-space: pre-wrap;">${received.text}</div>`

    await resend.emails.send({
        from: "Anirban Builds <contact@anirbanbuilds.online>",
        to : MAIL_ID,
        subject : `${received.subject || payload.subject || "New Message"}`,
        html: `
        <div style="font-family:sans-serif;line-height:1.6;">
            <hr/>
            <p><strong>From:</strong> ${received.from}</p>
           <div class="gmail_quote">
                <blockquote style="margin:0 0 0 0.8ex; border-left:1px #ccc solid; padding-left:1ex;">

                    <p style="color:#777;">--- Original Message ---</p>

                    <div style="color:#222;">
                        ${contentHtml}
                    </div>

                </blockquote>
            </div>
        </div>
        `
    })
}

export {forwardMail}