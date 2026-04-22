import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

const connectDB = async () => {
    try {
        const dbname = (process.env.IS_PULL_REQUEST === 'true' || process.env.APP_MODE === 'local')
         ? 'dev' : 'prod'
        const db_instance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}_${dbname}`)
        console.log(`\nMongoDB connected at host : ${db_instance.connection.host}`)
        console.log(`database mode : ${dbname}`)

    } catch (error) {
        console.log("DB Connection Error", error)
    }

}

export default connectDB