import app from './app.js'
import dotenv from 'dotenv'
import connectToDb from './db/db.js'
import cloudinary from 'cloudinary'

dotenv.config({
    path : '.env'
})

console.log(process.env.ACCESS_TOKEN_EXPIRY)

cloudinary.v2.config({
    cloud_name : process.env.CLOUDINARY_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_SECRET_KEY
})

const port = process.env.PORT || 3000

connectToDb()
.then(()=>{
    app.listen(port,()=>{
        console.log(`Server up at port : ${port}`)
    })
})
.catch((err)=>{
    console.log(`${err.message}`)
})

