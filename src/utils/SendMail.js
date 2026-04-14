import {Resend} from "resend"

const get_API_KEY = () => {
  return new Resend(process.env.RESEND_API_KEY)
}
const sendResetEmail = async (to, URL) => {
const resend = get_API_KEY()
  await resend.emails.send({
    from: "Anirban Builds <auth@anirbanbuilds.online>",
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family:sans-serif;">
        <h2>Password Reset</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${URL}"
           style="padding:10px 20px;background:#0bd4bc;color:#fff;text-decoration:none;border-radius:6px;">
           Reset Password
        </a>
        <p>This link expires in 10 minutes.</p>
      </div>
    `
  })
}

const sendOTPEmail = async (to, OTP) => {
  const resend = get_API_KEY()
  await resend.emails.send({
    from: "Anirban Builds <auth@anirbanbuilds.online>",
    to,
    subject: "Enter One time password",
    html: `
      <div style="font-family:sans-serif;">
        <h2>One Time Password</h2>
        <p>Enter the below to OTP to confirm your action:</p>
        <p>${OTP}</p>
        <p>This OTP expires in 5 minutes.</p>
      </div>
    `
  })
}

export {sendResetEmail, sendOTPEmail}