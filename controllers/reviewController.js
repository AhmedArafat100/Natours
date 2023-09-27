const Review = require('./../model/ReviewModel');
const catchAsync = require('./../utils/catchAsync')
const AppError =require('./../utils/appError')
const factory = require('./handlerFactory')


exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
  };





exports.addReview = factory.createOne(Review)

exports.getReview =factory.getOne(Review)

exports.getAllReviews = factory.getAll(Review)

exports.deleteReview = factory.deleteOne(Review);

exports.UpdateReview = factory.updateOne(Review);