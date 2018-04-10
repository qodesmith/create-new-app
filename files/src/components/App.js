import React, { Component } from 'react';

class Example extends Component {
  componentWillMount() {
    document.body.className = 'bg-black-80 f4 white-80';
  }

  render() {
    return(
      <div>
        <header className='pv5 bg-gold black-80'>
          <h1 className='mt0 mb1 tc'>Create New App</h1>
          <div className='tc ttc'>by the Qodesmith</div>
        </header>
        <div className='pt4 pb1 tc'>Go save the world with JavaScript</div>
        <div className='tc'>and edit <code>src/components/<span className='b'>App.js</span></code>!</div>
      </div>
    );
  }
};

export default Example;
