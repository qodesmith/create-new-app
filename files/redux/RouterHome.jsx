import React from 'react'
import { connect } from 'react-redux'
import { changeColor } from 'actions'


const Home = ({ color, randomizeColor }) => {
  return (
    <>
      <header className="pv5 bg-gold black-80 tc">
        <h1 className="mt0 mb1">Create New App</h1>
        <div className="ttc">by Qodesmith</div>
      </header>
      <div className="pt4 pb1 tc">
        Go save the world with <span className="b" style={{ color }}>JavaScript</span>
      </div>
      <div className="tc">
        and edit <code>src/components/<span className="b">Home.jsx</span></code>!
      </div>
      <div className="df justify-center mt3">
        <div className="ph3 pv2 no-select ba-1px pointer" onClick={randomizeColor}>
          Random Color
        </div>
      </div>
    </>
  )
}

const mapStateToProps = ({ home }) => home
const mapDispatchToProps = dispatch => ({
  randomizeColor: () => dispatch(changeColor())
})

export default connect(mapStateToProps, mapDispatchToProps)(Home)
