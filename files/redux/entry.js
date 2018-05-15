// Import our top-level sass file.
import './styles/styles.scss'

// Import React.
import React from 'react'
import ReactDOM from 'react-dom'

// Import our store provider.
import { Provider } from 'react-redux'

// Import our top-level component.
import App from 'components/App'

// Import a store, created & ready to go.
import store from './store'


// Create a single element for our app to live.
console.log('Loaded, bro.')
document.body.innerHTML = '<div id="app"></div>'

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#app')
)
