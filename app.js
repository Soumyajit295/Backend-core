import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express()

app.use(express.json())
app.use(express.urlencoded({extended : true,limit : '50mb'}))
app.use(cookieParser())
app.use(cors())

import userRouter from './routes/user.routes.js'

app.use('/api/v1/users',userRouter)

export default app