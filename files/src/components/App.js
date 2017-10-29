import React, { Component } from 'react';

export function didTreeShakingWork() {
  /*
    From the CLI run `npm run build`.
    Check the .js file in the dist folder.
    If the string below cannot be found, tree shaking worked!
  */
  return 'IF YOU CAN SEE ME THEN TREE SHAKING DID NOT WORK!';
}

class example extends Component {
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

export default example;
