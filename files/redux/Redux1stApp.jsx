import React, { Component } from 'react'
import { connect } from 'react-redux'
import { NOT_FOUND } from 'redux-first-router'
import { exampleActionCreator } from 'actions'
import NotFound from './NotFound'
import { Example1, Example2 } from './Example'

/*
  Each key in the `views` object represents a route found in `routesMap.js`.
  Redux First Router will dispatch an action the same as each key,
  which is found in the store via `location.type`
*/
const views = {
  [NOT_FOUND]: NotFound,
  HOME: Example1,
  EXAMPLE2: Example2
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  componentWillMount() {
    document.body.className = 'bg-black-80 fw4 white-80'
  }

  /*
    https://goo.gl/BGzrSf - React error handling!
    "Error boundaries catch errors during rendering,
    in lifecycle methods, and in constructors of the whole tree below them."
  */
  componentDidCatch(error) {
    this.setState({ error })
    console.log(error)
  }

  render() {
    const View = views[this.props.location.type]

    if (this.state.error) {
      return (
        <div className='w-50 w-100-m ph3'>
          <h2>Uh oh!</h2>
          <p>Looks like the client has encountered a problem.</p>
          <p>
            Please refresh your browser and try again.
            If this issue persists, scream and run around like you're on fire.
            Or, check the console and see what was logged. I mean either one is fine.
          </p>
        </div>
      )
    }

    return <View />
  }
}

const mapStateToProps = ({ location }) => ({ location })

export default connect(mapStateToProps)(App)
