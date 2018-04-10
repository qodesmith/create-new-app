import React, { Component } from 'react';
import { connect } from 'react-redux';
import { exampleActionCreator } from '../utils/actions'

class Example extends Component {
  componentWillMount() {
    document.body.className = 'bg-black-80 f4 white-80';
  }

  render() {
    const { title, author, color, randomizeColor } = this.props;
    const style = { color };

    return (
      <div onClick={randomizeColor}>
        <header className='pv5 bg-gold black-80'>
          <h1 className='mt0 mb1 tc'>{title}</h1>
          <div className='tc ttc'>by {author}</div>
        </header>
        <div className='pt4 pb1 tc'>Go save the world with <span style={style}>JavaScript</span></div>
        <div className='tc'>and edit <code>src/components/<span className='b'>App.js</span></code>!</div>
      </div>
    );
  }
};

const mapStateToProps = ({ example }) => ({
  title: example.title,
  author: example.author,
  color: example.color
});

const mapDispatchToProps = dispatch => ({
  randomizeColor: () => dispatch(exampleActionCreator())
});

export default connect(mapStateToProps, mapDispatchToProps)(Example);
