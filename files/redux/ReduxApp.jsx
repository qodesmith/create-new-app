import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { exampleActionCreator } from '../utils/actions'
import Example from './Example'


class App extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  componentWillMount() {
    document.body.className = 'bg-black-80 f4 white-80'
  }

  // React error handling!
  componentDidCatch(error) {
    this.setState({ error })
    console.log(error)
  }

  render() {
    if (this.state.error) {
      return (
        <Fragment>
          <h2>Uh oh!</h2>
          <p>Looks like the client has encountered a problem.</p>
          <p>
            Please refresh your browser and try again.
            If this issue persists, scream and run around like you're on fire.
            Or, check the console and see what was logged. I mean either one is fine.
          </p>
        </Fragment>
      )
    }

    return <Example />
  }
}

const mapStateToProps = ({ location }) => ({ location })

export default connect(mapStateToProps)(App)
