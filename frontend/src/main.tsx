import React from 'react';
import ReactDOM from 'react-dom/client';
import NevoBooking from './NevoBooking';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NevoBooking vehicleType={'tesla_model3'} />
  </React.StrictMode>
);