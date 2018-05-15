import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { exampleActionCreator } from 'actions'

const Example = ({ title, author, color, randomizeColor }) => (
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
    <div className='df justify-center align-items-center'>
      <div className='mt3 ph3 pv2 no-select ba-1px pointer' onClick={randomizeColor}>
        Random Color
      </div>
    </div>
  </Fragment>
)

const mapStateToProps = ({ example }) => ({ ...example })
const mapDispatchToProps = dispatch => ({
  randomizeColor: () => dispatch(exampleActionCreator())
})

export default connect(mapStateToProps, mapDispatchToProps)(Example)
