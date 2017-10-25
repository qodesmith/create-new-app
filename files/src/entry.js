// Import our top-level sass file.
import './styles/styles.scss';

// Import React.
import React from 'react';
import ReactDOM from 'react-dom';

// Import our tep-level component.
import App from './components/App';

// Create a single element for our app to live.
console.log('Loaded, bro.');
document.body.innerHTML = '<div id="app"></div>'

// Mount our app.
ReactDOM.render(
  <App />,
  document.querySelector('#app')
);
