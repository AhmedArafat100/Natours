const path = require('path')
const express =require("express");
const morgan = require('morgan')
const dotenv =require("dotenv")
const mongoose =require('mongoose')
const AppError =require('./utils/appError')
const rateLimit= require('express-rate-limit')
const helmet =require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss =require('xss-clean')
const hpp = require('hpp')
const compression = require('compression')
const cookieParser= require('cookie-parser')
const globalErrorHandler =require('./controllers/errorController')
dotenv.config({path:'./config.env'});


const TourRouter = require('./routes/tourRouter')
const UserRouter = require('./routes/userRouter')
const reviewRouter = require('./routes/reviewRouter')
const viewRouter = require('./routes/viewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const app =express();

app.set('view engine','pug')
app.set('views',path.join(__dirname,'views'))

//1) Global MIDDLEWARES

// Set security HTTP headers
app.use( helmet({ contentSecurityPolicy: false }) )


// Development logging
if(process.env.NODE_ENV=== 'development'){
    app.use(morgan('dev'))
}


// Limit requests from same API
const limiter =rateLimit({
    max:100,
    windowMs:60 * 60 * 1000,
    message:"Too many requests, try again later!!"
})

app.use('/api',limiter)



app.use(express.json({ limit: '10kb'}))
app.use(cookieParser())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())


// Data sanitization against XSS
app.use(xss())
// Prevent parameter pollution
app.use(
    hpp({
      whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
      ]
    })
  );

  
app.use(express.static(path.join(__dirname,'public')))

//3)ROUTES

app.use('/',viewRouter)
app.use('/api/v1/tours', TourRouter);
app.use('/api/v1/users', UserRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking',bookingRouter);

//error handler

app.use(compression())

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
  });

app.all('*',(req,res,next)=>{
    // const err =new Error(`Can Not find ${req.originalUrl} on this server!!`);
    // err.status = 'fail';
    // err.statusCode=404;

    // next(err);

    next(new AppError(`Can Not find ${req.originalUrl} on this server!!`,404))
})

app.use(globalErrorHandler)



const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  );
  
  mongoose
   .connect(DB, {
//    .connect(process.env.DATABASE_LOCAL,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection successful!'));

//4)START SERVER
const port = process.env.PORT||3000;
app.listen(port,()=>{
    console.log(`SERVER IS RUNNING ON PORT ${port}!!`);
})
process.on('unhandledRejection',err=>{
    console.log("unhandledRejection!! SHUTTING DOWN");
    console.log(err);
    server.close(()=>{
        process.exit(1);
    })
})

process.on('uncaughtException',err=>{
    console.log("uncaughtException!! SHUTTING DOWN");
    console.log(err);
    server.close(()=>{
        process.exit(1);
    })
})