/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51Oko5LSGA36pKM9wQdX85417g5pjye9cCga8iofgTBBuCVndaTcRCj01bzOTd3SUwEt9EmwaSUCHmoY9FBbq1fSY00eu1o9JhX'
);

export const bookTour = async tourId => {
  try {
    // 1. Get checkout session from the API
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);
    // console.log(session);

    // 2. Create a checkout form + charge credit card
    // look int the console log to find the session id
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
