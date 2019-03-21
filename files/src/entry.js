// You may or may not need this depending on
// what JavaScript features you're using - e.x. async / await.
// Feel free to remove it and see what happens!
import '@babel/polyfill'

// Import our top-level sass file.
import './styles/styles.scss'

// Import React.
import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom'

// Import our top-level component.
import App from 'components/App'

// Create a single element for our app to live.
document.body.innerHTML = '<div id="app"></div>'
document.body.className = 'bg-black-80 fw4 white-80'

// Mount our app.
// `StrictMode` is a tool for highlighting potential problems in React apps.
// It doesn't affect production builds. 3rd party modules may trigger a lot of noise.
// Read more here - https://goo.gl/fcaMYi
ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.querySelector('#app')
)
