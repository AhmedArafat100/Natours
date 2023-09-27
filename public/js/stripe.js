/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';
// const stripe = Stripe('pk_test_51NsV7FE2WQkGjrBWBOGMEoXIigzVBI4DUu44WrZoVk2KQ7Kw80N2eQcqfolAfsk2CQr7AVNT9uSroAw6N3AzJNM4003LjK6zW9');
const stripe= Stripe('pk_test_51NsV7FE2WQkGjrBWBOGMEoXIigzVBI4DUu44WrZoVk2KQ7Kw80N2eQcqfolAfsk2CQr7AVNT9uSroAw6N3AzJNM4003LjK6zW9')
export const bookTour = async tourId => {
  try{
        // 1) Get checkout session from API
        const session = await axios(
          `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`
        );
        console.log(session);
            // 2) Create checkout form + chanre credit card

         await stripe.redirectToCheckout({
            sessionId: session.data.session.id
          });

  }catch(err){
    console.log(err);
    showAlert('error',err)
  }





};