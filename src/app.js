import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import projectsRoutes from '../src/routes/projects.routes.js'
import UserRoutes from './routes/users.routes.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}
))

app.use(express.json({ limit: '32kb' }))
app.use(express.urlencoded({ extended: true, limit: '32kb' }))
app.use(express.static('public'))
app.use(cookieParser())

app.use(`/api/${process.env.API_VERSION}/projects`, projectsRoutes)
app.use(`/api/${process.env.API_VERSION}/users`, UserRoutes)

app.get("/", (req, res) => {
  res.send("Backend is Live 🚀")
})

export default app