// You may or may not need this depending on
// what JavaScript features you're using - e.x. async / await.
// Feel free to remove it and see what happens!
import '@babel/polyfill'

// Import our top-level sass file.
import './styles/styles.scss'

// Import React.
import React from 'react'
import ReactDOM from 'react-dom'

// Import our top-level component.
import App from 'components/App'

// Create a single element for our app to live.
document.body.innerHTML = '<div id="app"></div>'

// Mount our app.
ReactDOM.render(
  <App />,
  document.querySelector('#app')
)
