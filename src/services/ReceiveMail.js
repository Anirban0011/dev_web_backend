import {Resend} from "resend"
import { MAIL_ID } from "../constants.js"
const resend = new Resend(process.env.RESEND_API_KEY)

const forwardMail = async(payload)=>{
    const emailid = payload?.email_id
    const {data : received} = await resend.emails.receiving.get(emailid)

    const mode = process.env.APP_MODE === 'local' ? '[TEST] ' : ''

    const contentHtml = received.html || `<div style="white-space: pre-wrap;">${received.text}</div>`

    await resend.emails.send({
        from: "Anirban Builds <contact@anirbanbuilds.online>",
        to : MAIL_ID,
        subject : `${mode}${received.subject || payload.subject || "New Message"}`,
        html: `
        <div style="font-family:sans-serif;line-height:1.6;color:#000;">
        <p><strong>From:</strong> ${received.from}</p>

        <details>
            <div class="gmail_quote" style="font-family:sans-serif;">
                    ${contentHtml}
                </blockquote>
            </div>
        </details>
        <div style="font-size: 10px; color: #bdc1c6; margin-top: 30px;">
            Sent via ${mode ? 'Dev' : 'Prod'} Pipeline
        </div>
        </div>`
    })
}

export {forwardMail}