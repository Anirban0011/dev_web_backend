import {ProjectCard, projectTitle, ProjectTags} from "../models/project.model.js"
import AsyncHandler from '../utils/AsyncHandler.js'
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import cloudUpload from "../utils/cloudinary.js"
import { OK } from "../constants.js"

const Addproject = AsyncHandler(async (req, res) => {

    const projImagePath = req.file?.path

    if(!projImagePath){
        throw new ApiError(400, "Project cover Image is required !")
    }

    const projImage = await cloudUpload(projImagePath, "projects")

    if(!projImage){
        throw new ApiError(400, "Image failed to upload on cloudinary")
    }

    const {projTitle, projRepo, selectedTags} = req.body
    const tags = JSON.parse(selectedTags)
    const projectcard = await ProjectCard.create({
        image : projImage.url, //url
        title : projTitle,
        repo : projRepo,
        tags : tags
    })

    if(!projectcard){
        throw new ApiError(400, "Project not created")
    }
    console.log("project created")
    // Add project title keywords
    const kwords = projTitle.split(" ")
    let kwordmap
    for (let i=0; i<kwords.length; i++){
        let prefix = []
        for(let j= i; j<kwords.length; j++){
            prefix.push(kwords[j].toLowerCase())

        const kword = await projectTitle.findOne({kword : prefix.join(" ")})
        if(!kword){
            kwordmap = await projectTitle.create({
                kword : prefix.join(" "),
                kmap : [projectcard._id]
        })}
        else{
            kwordmap = await projectTitle.findByIdAndUpdate(
            kword._id,
            {$addToSet : {kmap: projectcard._id}},
            {new : true}
            )}
    }}
    if(!kwordmap){
        throw new ApiError(400, "Error adding project keywords")
    }
    console.log("project keywords added")
    //Add project tags for search
    let tres
    for(let i=0; i<tags.length; i++){
        const tagExist = await ProjectTags.findOne({tag : tags[i]})
        if(!tagExist){
            tres = await ProjectTags.create({
                tag: tags[i],
                tmap : [projectcard._id]
            })
        }
        else{
            tres = await ProjectTags.findByIdAndUpdate(
                tags[i]._id,
                {$addToSet : {tmap : projectcard._id}},
                {new : true}
            )}
    }
    if(!tres){
        throw new ApiError(400, "Error adding project tags")
    }
    console.log("project tags added")
    return res.status(OK).json(
        new ApiResponse(OK, {}, "Project added Successfully")
    )
})

const Getprojects = AsyncHandler(async(req, res) =>{
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 12
    const skip = (page - 1)*limit
    const search = req.query.q || ""
    const tags = req.query.tags || []
    const filter = {
    title: { $regex: search, $options: "i" }
    }

    if (tags.length > 0) {
    const tres = await ProjectTags.find({tag : {$in : tags}})
    const projids = [...new Set(tres.flatMap(t =>t.tmap))]
    filter._id = { $in: projids }
    }

    const tot = await ProjectCard.countDocuments(filter)
    const projects = await ProjectCard.find(filter)
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)

    return res.status(OK).json(
        new ApiResponse
        (OK,
        {
            projects : projects,
            tot: tot
        },
        "Projects fetched Successfully")
    )
})

const GetprojTitles = AsyncHandler(async(req, res)=>{
    // make search more robust
    const title = req.query.title?.trim().toLowerCase()
    if(!title){
        return res.
        status(400).
        json(new ApiResponse(
            400, {}, "No title provided"))
    }

     if (title.length > 100) {
        return res.status(400).json(new ApiResponse(400, {}, "Search too long"))
    }
    // special characters to be taken as is not literally
    const title_ = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const kres = await projectTitle.find({kword : {$regex : title_}})
    const projids = [...new Set(kres.flatMap(k=> k.kmap))]
    const projs = await ProjectCard.find({_id : {$in : projids}})

    return res.status(OK).json(new ApiResponse
        (OK,
            {titles : projs},
            "kwords fetched successfully"
        )
    )
})

export {Addproject, Getprojects, GetprojTitles}