import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { exampleActionCreator } from 'actions'
import Link from 'redux-first-router-link'

const E1 = ({ title, author, color, randomizeColor }) => (
  <Fragment>
    <header className='pv5 bg-gold black-80 tc'>
      <h1 className='mt0 mb1'>{title}</h1>
      <div className='ttc'>by {author}</div>
    </header>
    <div className='pt4 pb1 tc'>
      Go save the world with <span style={{ color }}>JavaScript</span>
    </div>
    <div className='tc'>
      and edit <code>src/components/<span className='b'>App.js</span></code>!
    </div>
    <div className='df justify-center mt3'>
      <div className='mr2 ph3 pv2 no-select ba-1px pointer' onClick={randomizeColor}>
        Random Color
      </div>

      {/* https://goo.gl/DJjc4W */}
      <Link to={{type: 'EXAMPLE2'}}>
        <div className='ml2 ph3 pv2 no-select ba-1px pointer white-80'>Example page 2</div>
      </Link>
    </div>
  </Fragment>
)

const mapStateToProps = ({ example }) => ({ ...example })
const mapDispatchToProps = dispatch => ({
  randomizeColor: () => dispatch(exampleActionCreator()),
})

export const Example1 = connect(mapStateToProps, mapDispatchToProps)(E1)

export class Example2 extends Component {
  constructor(props) {
    super(props)
    this.state = { date: new Date().toLocaleString() }
  }

  componentDidMount() {
    this.interval = setInterval(() => this.setState({
      date: new Date().toLocaleString()
    }), 1000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    return (
      <div className='df justify-center align-items-center vh-100'>
        <h1 className='ma0 tc'>{this.state.date}</h1>
      </div>
    )
  }
}
