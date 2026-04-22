export const DB_NAME = "DEV_WEB_DB"
export const OK = 200
export const GH_LOGO = "https://res.cloudinary.com/dhxrndnrv/image/upload/v1763567111/GitHub_Logo_White_s7sqfi.png"
export const MAIL_ID = "anirban21100@alumni.iiitnr.ac.in"
export const MODE = (process.env.IS_PULL_REQUEST === 'true' || process.env.APP_MODE === 'local')
         ? 'dev' : 'prod'