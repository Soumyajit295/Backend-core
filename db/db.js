import mongoose from "mongoose";

const connectToDb = async()=>{
    mongoose.connect(process.env.MONGO_URL)
    .then((conn)=>{
        console.log(`Database connected : ${conn.connection.host}`)
    })
    .catch((err)=>{
        console.log(`Database connection failed : ${err.message}`)
    })
}

export default connectToDb