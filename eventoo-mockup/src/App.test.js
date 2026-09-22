import React from 'react';
import { render } from '@testing-library/react';
import App from './App';
// import './assets/js/jquery-1.12.4.min.js';
// import './assets/js/popper.min.js';
// import './assets/js/bootstrap.min.js';
// import './assets/js/venobox.min.js';
// import './assets/js/slick.min.js';
// import './assets/js/script.js';



test('renders learn react link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
