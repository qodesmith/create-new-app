__PLACEHOLDER_ENTRY_COMMENT__

/*
  Import our top-level scss file.
  All other scss files should be imported in `styles.scss`.
*/
import './styles/styles.scss'

// Import React.
import React from 'react'
import ReactDOM from 'react-dom'

// Import our top-level component.
import App from 'components/App'

// Mount our app.
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.querySelector('#app'),
)
