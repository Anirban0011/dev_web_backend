import mongoose from "mongoose"
import {DB_NAME, MODE} from "../constants.js"

const connectDB = async () => {
    try {
        const db_instance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}_${MODE}`)
        console.log(`\nMongoDB connected at host : ${db_instance.connection.host}`)
        console.log(`database mode : ${MODE}`)

    } catch (error) {
        console.log("DB Connection Error", error)
    }

}

export default connectDB