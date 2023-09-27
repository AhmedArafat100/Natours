const dotenv =require("dotenv")
const mongoose =require('mongoose')
const fs =require('fs')
const Tour =require('./../../model/tourModel')
const Review =require('./../../model/ReviewModel')
const User =require('./../../model/userModel')




dotenv.config({path:'./config.env'});

mongoose
// .connect(DB, 
.connect(process.env.DATABASE_LOCAL,{
     useNewUrlParser: true, 
     useUnifiedTopology: true
 })
 .then(() => console.log('DB connection successful!'));

 const tours =JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'))
 const users =JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'))
 const reviews =JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'))

 const importData= async ()=>{
    try {
        await Tour.create(tours)
        await Review.create(reviews)
        await User.create(users,{validateBeforeSave:false})
        console.log("Data loaded succefully!!");
        
    } catch (error) {
        console.log(error);
    }
    process.exit()
 }


 const DeleteData = async()=>{
    try {
        await Tour.deleteMany()
        await Review.deleteMany()
        await User.deleteMany()
        console.log("Data deleted succefully!!");
        
    } catch (error) {
        console.log(error);
    }
    process.exit()
 }

 if (process.argv[2] === '--import') {
    importData();
    
 } else if(process.argv[2] === '--delete') {
    DeleteData();
    
 }
