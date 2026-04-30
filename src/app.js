import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import projectsRoutes from '../src/routes/projects.routes.js'
import emailRoutes from './routes/email.routes.js'
import UserRoutes from './routes/users.routes.js'
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
app.use(`/api/${process.env.API_VERSION}/emails`, emailRoutes)

app.get("/", (req, res) => {
  res.send("Backend is Live 🚀")
})

app.get(`/api/${process.env.API_VERSION}`, (req, res) => {
  res.send( "API is running 🚀")
})

export default app