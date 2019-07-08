__PLACEHOLDER_ENTRY_COMMENT__

// Import our top-level sass file.
import './styles/styles.scss'

// Import React.
import React from 'react'
import ReactDOM from 'react-dom'

// Import our store provider.
import { Provider } from 'react-redux'

// Import our components.
import Home from 'components/Home'
import NotFound from 'components/NotFound'

// Import a store, created & ready to go.
import store from './store'

// Import React Router things.
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'


// Top-level classes on the body. Feel free to remove / change.
document.body.className = 'bg-black-80 fw4 white-80'

// Mount our app.
ReactDOM.render(
  <Provider store={store}>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  </Provider>,
  document.querySelector('#app')
)
