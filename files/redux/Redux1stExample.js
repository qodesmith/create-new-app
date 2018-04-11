import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { exampleActionCreator } from '../utils/actions'

const E1 = ({ title, author, color, randomizeColor }) => (
  <Fragment>
    <header className='pv5 bg-gold black-80 tc'>
      <h1 className='mt0 mb1'>{title}</h1>
      <div className='ttc'>by {author}</div>
    </header>
    <div className='pt4 pb1 tc'>
      Go save the world with <span style={{ color }}>JavaScript</span>
    </div>
    <div className='tc'>and edit <code>src/components/<span className='b'>App.js</span></code>!</div>
    <div className='flex justify-center'>
      <button className='mr2' onClick={randomizeColor}>Random Color</button>
      <button className='ml2'>Example page 2</button>
    </div>
  </Fragment>
);

const mapStateToProps = ({ example }) => ({
  title: example.title,
  author: example.author,
  color: example.color
});

const mapDispatchToProps = dispatch => ({
  randomizeColor: () => dispatch(exampleActionCreator()),
});

export const Example1 = connect(mapStateToProps, mapDispatchToProps)(E1);

export class Example2 extends Component {
  constructor() {
    this.state = { date: new Date().toLocaleString() }
  }

  componentDidMount() {
    this.interval = setInterval(() => this.setState({
      date: new Date().toLocaleString()
    }), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div className='flex justify-center align-items-center'>
        <h1>{this.state.date}</h1>
      </div>
    );
  }
};
