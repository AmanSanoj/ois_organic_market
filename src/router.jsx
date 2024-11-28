import { createBrowserRouter } from 'react-router-dom';
import PaymentResult from './pages/PaymentResult';

export const router = createBrowserRouter([
  // Your existing routes here
  {
    path: '/payment/success',
    element: <PaymentResult />,
  },
  {
    path: '/payment/failure',
    element: <PaymentResult />,
  },
  {
    path: '/payment/cancel',
    element: <PaymentResult />,
  },
]);
