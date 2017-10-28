import React from 'react';

export function didTreeShakingWork() {
  /*
    From the CLI run `npm run build`.
    Check the .js file in the dist folder.
    If the string below cannot be found, tree shaking worked!
  */
  return 'IF YOU CAN SEE ME THEN TREE SHAKING DID NOT WORK!';
}

const example = () => (
  <div>
    <header className='pv3'>
      <h1 className='ma0 tc f-6 lh-solid'>QodeCreative</h1>
      <div className='tc tracked-mega ttc'>starter kit</div>
    </header>

    <section className='ph4 dt center'>
      <h2>'.env' file</h2>
      <ul>
        <li>Create this file in the root of this project</li>
        <li>Here are the minimum contents:</li>
        <ul>
          <li>PORT=&lt;<span className='i'>port number</span>&gt;</li>
          <li>mongoURI=mongodb://localhost:27017/&lt;<span className='i'>collection name</span>&gt;</li>
          <li>mongoSession=&lt;<span className='i'>collection name</span>&gt;</li>
          <li>secret=&lt;<span className='i'>your secret</span>&gt;</li>
        </ul>
      </ul>

      <h2>Webpack adjustments</h2>
      <ul>
        <li>'includePaths' in the sass-loader</li>
        <li>'HtmlWebpackPlugin' title</li>
        <li>'HtmlWebpackPlugin' description</li>
        <li>devServer.proxy => <span className='i'>adjust to taste</span></li>
        <li>output.publicPath</li>
        <ul>
          <li>Server needed - currently set to '/'</li>
          <li>No server needed - set to '', allows opening 'index.html' directly in the browser</li>
        </ul>
      </ul>

      <h2>File removals / adjustments</h2>
      <ul>
        <li>remove: src/styles/qode-creative-introduction.scss</li>
        <li>remove: src/components/example (the whole folder)</li>
        <li>adjust: src/entry.js</li>
        <li>adjust: server.js</li>
        <ul>
          <li>Change the 'name' of the session store middleware</li>
          <li>Initial value: 'Qode Create Starter Kit'</li>
        </ul>
        <li>adjust: package.json</li>
        <ul>
          <li>"browserslist": "last 2 versions" => <span className='i'>adjust to taste</span></li>
          <li>^^^ This is used to direct the postcss autoprefixer plugin</li>
        </ul>
      </ul>
    </section>
  </div>
);

export default example;
