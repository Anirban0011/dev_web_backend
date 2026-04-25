import 'dotenv/config'
import mongoose from 'mongoose'
import {DB_NAME, MODE} from "../src/constants.js"
import { ProjectCard } from '../src/models/project.model.js'

await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}_${MODE}`)
console.log("Connected")

const oldProjects = await ProjectCard.find({ repo: { $type: "array" } }).lean()
console.log("Found old docs:", oldProjects.length)

for(const proj of oldProjects){
    console.log("repo value:", proj.repo, "type:", typeof proj.repo)
    await ProjectCard.findByIdAndUpdate(proj._id, {
        repo: "",
        deploy: proj?.repo[0]
    })
    console.log("Migrated:", proj._id)
}
// 

console.log("Done")
await mongoose.disconnect()