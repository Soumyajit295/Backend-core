import cloudinary from 'cloudinary'
import fs from 'fs'
const uploadTocloudinary = async(localFilePath)=>{

    if(!localFilePath) return null

    try{
        const result = await cloudinary.v2.uploader.upload(localFilePath,{
            width : 250,
            height : 250,
            gravity : 'faces',
            crop : 'fill'
        })
        if(result){
            fs.unlinkSync(localFilePath)
            return result
        }
    }
    catch(err){
        console.log("Error : ",err.message)
        return null
    }
}

export default uploadTocloudinary