const { promisify } = require('util')
const User = require('./../model/userModel');
const jwt =require('jsonwebtoken')
const catchAsync = require('./../utils/catchAsync')
const AppError =require('./../utils/appError')
const Email =require('./../utils/email')
const crypto =require('crypto')


const signToken=id=>{
  return jwt.sign({id:id},process.env.JWT_SECRET,{
    expiresIn:process.env.JWT_EXPIRES_IN
  })
}
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};


exports.signUp=catchAsync(async(req,res,next)=>{

    const newUser = await User.create(req.body)
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser,201,res);
})


exports.login=catchAsync(async (req,res,next)=>{
  const{email,password}=req.body;

  //1) CHECK IF EMAIL & PASSWORD EXISTS

  if(!email || !password){
        return next(new AppError('please enter email and password',400))
  }

  //2) CHECK IF USER EXISTS & PASSWORD IS CORRECT
  const user =await User.findOne({email}).select('+password')

  if(!user || !(await user.correctPassword(password,user.password))){
    return next(new AppError('Incorrect email or password',401))
  }

  //3) IF EVERYTHING IS OK, SEND TOKEN TO CLIENT
  createSendToken(user,200,res);

})


exports.protect= catchAsync( async(req,res,next)=>{

  //Getting Token and check of its there

  let token;

  if(
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ){
    token =  req.headers.authorization.split(' ')[1];
  }else if(req.cookies.jwt){
    token = req.cookies.jwt
  }

  if(!token){
    return next(new AppError('you are not authorized!!',401))
  }

  //verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exists
  const freshUser = await User.findById(decoded.id)

  if(!freshUser){
    return next(new AppError('the user that does no longer exist',401))
  }

  //check if user changed password after token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  req.user=freshUser
  res.locals.user = freshUser;
  next();
})



exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};






exports.restrictTo=(...roles)=>{
  return (req,res,next)=>{
    if(!roles.includes(req.user.role)){
      return next(new AppError('You Are Not Authorized!!!',403))
    }

    next()
  }
}

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email

  try {


    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;


    await new Email(user,resetURL).sendPasswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});


exports.resetPassword=catchAsync(async(req,res,next)=>{

  //1
  const hashedToken = crypto
  .createHash('sha256')
  .update(req.params.token)
  .digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }
  user.password=req.body.password
  user.passwordConfirm =req.body.passwordConfirm
  user.passwordResetToken=undefined
  user.passwordResetExpires=undefined
  await user.save();

  //3


  //4
  createSendToken(user,200,res);

})

exports.updatePassword =catchAsync( async(req,res,next)=>{
  //1)GET USER FROM COLLECTION

  const user = await User.findById(req.user.id).select('+password')

  //2) CHECK IF POSTED PASSWORD IS COORECT

  if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
    return next(new AppError('your Current Password is Wrong',401))
  }

  //3) IF THE PASSWORD IS CORRECT  UPDATE PASSWORD
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save();

  //4)LOG USER IN , SEND JWT
  createSendToken(user,200,res);

})