import mongoose, {Schema} from 'mongoose'

const projectCardSchema = new Schema({
    image : {type: String, required : true}, // cloudinary URL is stored
    title : {type: String, required: true},
    tags : {type: [String], required: true},
    repo : {type : String, required : true}, // git repo link
    deploy : {type : String, required : true} // hf space link
}, { versionKey: false })

const projectTitleSchema = new Schema({
    kword : {type: String, unique : true, required : true},
    kmap : {type : [mongoose.Schema.Types.ObjectId], required : true}
}, {versionKey: false})

const projectTagSchema = new Schema({
    tag : {type : String, required: true},
    tmap :{type: [mongoose.Schema.Types.ObjectId], required: true}
}, {versionKey : false})

const ProjectCard = mongoose.model('ProjectCard', projectCardSchema)
const projectTitle = mongoose.model('ProjectTitle', projectTitleSchema)
const ProjectTags = mongoose.model('ProjectTags', projectTagSchema)
export {ProjectCard, projectTitle, ProjectTags}
