const express =require('express')
const router=express.Router({ mergeParams : true});

const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authController')

router.use(authController.protect)

router
.route('/')
.post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.addReview
    )

router
.route('/')
.get(reviewController.getAllReviews)

router
.route('/:id')
.delete(
    authController.restrictTo('user','admin'),
    reviewController.deleteReview)
.patch(
    authController.restrictTo('user','admin'),
    reviewController.UpdateReview)

module.exports=router