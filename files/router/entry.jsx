__PLACEHOLDER_ENTRY_COMMENT__

// Import our top-level sass file.
import './styles/styles.scss'

// Import React.
import React from 'react'
import ReactDOM from 'react-dom'

// Import our components.
import Home from 'components/Home'
import NotFound from 'components/NotFound'

// Import React Router things.
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'


// Top-level classes on the body. Feel free to remove / change.
document.body.className = 'bg-black-80 fw4 white-80'

// Mount our app.
ReactDOM.render(
  <Router>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  </Router>,
  document.querySelector('#app')
)
