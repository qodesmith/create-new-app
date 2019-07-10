```text
                         __
                        /\ \__
  ___  _ __   __     __ \ \ ,_\    __
 /'___/\`'__/'__`\ /'__`\\ \ \/  /'__`\
/\ \__\ \ \/\  __//\ \L\.\\ \ \_/\  __/
\ \____\ \_\ \____\ \__/.\_\ \__\ \____\
 \/____/\/_/\/____/\/__/\/_/\/__/\/____/
  ___      __  __  __  __
/' _ `\  /'__`/\ \/\ \/\ \
/\ \/\ \/\  __\ \ \_/ \_/ \
\ \_\ \_\ \____\ \___x___/'
 \/_/\/_/\/____/\/__//__/
   __    _____   _____    By: The Qodesmith
 /'__`\ /\ '__`\/\ '__`\
/\ \L\.\\ \ \L\ \ \ \L\ \
\ \__/.\_\ \ ,__/\ \ ,__/
 \/__/\/_/\ \ \/  \ \ \/
           \ \_\   \ \_\
            \/_/    \/_/
```

# Create New App &middot; [![npm version](https://badge.fury.io/js/create-new-app.svg)](https://badge.fury.io/js/create-new-app)

Create full-stack React applications! All the tech you've come to know and love - React, Redux, Express, & MongoDB. Use some, use none, but _always_ use React ;)

## The Why
You want to make apps. You want to make apps with [React](https://reactjs.org/). Excellent choice.

[Create React App](https://github.com/facebookincubator/create-react-app) is awesome, no doubt, ~~but you find yourself constantly tweaking files to get [SCSS](http://sass-lang.com/) included.~~ And wouldn't you know it? Your app needs an API - so you look to [Express](https://expressjs.com/). Heck, you might _already have_ an API! But how to integrate it? And to top it off, you like using JavaScript up and down the stack, so your persistence layer is [MongoDB](https://mongodb.github.io/node-mongodb-native/). But CRA doesn't give you all of this out of the box. What's a developer to do?

**[Create New App](https://github.com/qodesmith/create-new-app)**, _that's_ what you do!

It's just like CRA but with full stack options - and more! You get a [Webpack](https://webpack.js.org/configuration/) development server, a build which ties all-the-things together, and a custom SCSS utility library named [Sassyons](https://github.com/qodesmith/sassyons). Optionally include [React Router](https://reacttraining.com/react-router/), [Redux](https://redux.js.org/), [Express](https://expressjs.com/), and [MongoDB](https://mongodb.github.io/node-mongodb-native/). Don't need some of the goodies included? No worries! A few CLI flags and you're off to the web development races with whatever it is you _do_ need. No ejecting either. Everything is set up for you, loaded with comments and links, and ready for your tweaking - or not. You're gonna like this. I promise.

## Installation

```shell
npm install -g create-new-app
```

## Usage

### Guided Process

It couldn't be easier to use Create New App. Simply type `create-new-app` (or `cna` for short) and you'll start the guided process, being asked up to 5 questions:
1. Enter a name for your app
2. Would you like to include Redux?
3. Would you like to include React Router?
4. Would you like to include an Express server?
5. Would you like to include MongoDB?

### Manual Options

Simplest example: `create-new-app <app-name>`<br>
^^^ #Boom. Your app is running on `http://localhost:8080`.

Want the full control of all the options? No problem:
```shell
create-new-app <app-name> [options]

# Shorthand:
cna <app-name> [options]
```

### Sandbox Project

Sometimes you simply want a quick sandbox project to test something real quick. Maybe in order to test a simple function or some CSS. Create New App has you covered:

```shell
cna <app-name> --sandbox
```

This will generate 3 files for you, tied together in `index.html`:
1. index.html
2. main.js
3. styles.css

Simple, no? Let's look at some other examples...


## Other Examples

```shell
# Let the guided process walk you through it:
create-new-app

# You already have a local API built & running at `localhost:1234`:
create-new-app awesomeness --api / --apiPort 1234

# Perhaps all requests to that local api are behind the `/api` flag:
create-new-app awesomeness --api /api --apiPort 1234

# You've decided you want a new API. Express is set up for you:
create-new-app awesomeness -e

# You want a new API with MongoDB wired up & ready to go:
create-new-app awesomeness -m
```


## Webpack Magic

**Webpack 4!!!** While Webpack certainly seems like magic, let's just go over what that "magic" is doing for you in this project.

### Development Server

This is an obvious one. You're developing, right? Well, you're in luck. Webpack is running a development server that defaults to port 8080. Visit `http://localhost:8080`, make changes to your JS or SCSS files, and watch Webpack refresh that screen.

### Tree Shaking / Minification

Delivers super-sexy minified JavaScript without those dead branches! Your CSS is purged & minified as well. #Bandwidth

### Babel / Polyfilling

Write ES6+ and beyond. Babel 7 is integrated and CNA is tweaked to support modern browsers. If you need to support older browsers, simply adjust the `browserslist` field in the `package.json` file. `@babel/polyfill` has been [deprecated](http://bit.ly/2DTXGpe), but fear not! `core-js` to the rescue. Check it out at the top of `entry.js`.

### Postcss

SCSS is included and get's compiled down to CSS. But that's half the magic. [Postcss](https://github.com/postcss/postcss) is [autoprefixing](https://github.com/postcss/autoprefixer) our styles, smartly grouping [media queries](https://github.com/hail2u/node-css-mqpacker) together, [combining](https://github.com/ChristianMurphy/postcss-combine-duplicated-selectors) redudant selectors, [removing](https://github.com/ben-eb/postcss-discard-comments) comments, minifying [color names](https://www.npmjs.com/package/postcss-colormin), and [sorting](https://github.com/Siilwyn/css-declaration-sorter) properties for better gzip compression! It's also [purging](https://github.com/FullHuman/postcss-purgecss) unused css (see below).

### Purgecss

Automatically [removes unused CSS](https://www.purgecss.com/)! It's only triggered when you run a build for production, so you can still hack away in Chrome's console and have access to all your styles. Also included is the [purgecss-whitelister](https://github.com/qodesmith/purgecss-whitelister) to prevent CSS from 3rd party tools being removed that you want to keep.

### CleanWebpackPlugin

[CleanWebpackPlugin](http://bit.ly/2WEalXF) is used to clean the `dist` folder when running a build. It's the folder that will contain your app's bundled assets.

### MiniCssExtractPlugin

[MiniCssExtractPlugin](http://bit.ly/2YYiAvg) removes the CSS data that's in the JS bundle and extracts it into a CSS file. This is the recommended plugin to use instead of the old [extract text webpack plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin).

### HtmlWebpackPlugin

[HtmlWebpackPlugin](http://bit.ly/2WBxaLR) generates the `index.html` file. Dynamically creates a `<style>` tag in the `<head>` of the document and a `<script>` tag before the closing `<body>` tag, referencing the build assets.


## Options

### Redux

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Alias</th>
      <th>Type</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="125px"><code>--redux</code></td>
      <td align="center"><code>-x</code></td>
      <td>Boolean</td>
      <td>
        Includes <a href="https://redux.js.org/">Redux</a> in your application, completely wired up & ready to go. Store, reducers, middleware... all that good stuff.
        <br><br>
        <em>Examples:</em>
        <br><code>--redux</code>
        <br><code>-x</code>
      </td>
      <td><code>false</code></td>
    </tr>
  </tbody>
</table>


### React Router

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Alias</th>
      <th>Type</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="125px"><code>--router</code></td>
      <td align="center"><code>-r</code></td>
      <td>Boolean</td>
      <td>
        Includes <a href="https://github.com/ReactTraining/react-router">React Router</a> in your application, completely wired up & ready to go. Enjoy the widely supported go-to router of choice in the React ecosystem!
        <br><br>
        <em>Examples:</em>
        <br><code>--router</code>
        <br><code>-r</code>
      </td>
      <td><code>false</code></td>
    </tr>
  </tbody>
</table>


### Server - Express, MongoDB, API

If you're developing a fullstack app we've got you covered with Express and MongoDB. If you _already have_ an existing server that you'd like to connect to - these options are for you too.

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Alias</th>
      <th>Type</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="180px"><code>--express</code></td>
      <td width="80px" align="center"><code>-e</code></td>
      <td>Boolean</td>
      <td>
        Set's up a Node server running Express.
        <br><br>
        <em>Examples:</em>
        <br><code>--express</code>
        <br><code>-e</code>
      </td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td ><code>--api</code></td>
      <td align="center">-</td>
      <td>String</td>
      <td>
        Sets the key value to <code>devServer.proxy[api]</code> in <code>webpack.config.js</code>. Used when you have a local back-end you'd like to proxy requests to while developing. For example, set this to <code>/api</code> if your backend responds to calls at <code>/api/some-endpoint</code>.
        <br><br>
        <em>Examples:</em>
        <br><code>--api /api</code>
        <br><code>--api=/api</code>
      </td>
      <td><code>`null`</code></td>
    </tr>
    <tr>
      <td><code>--mongo</code></td>
      <td align="center"><code>-m</code></td>
      <td>Boolean</td>
      <td>
        Set's up MongoDB with a Node server running Express, all wired up & ready to go! If you use this option, no need to also use `--express`.
        <br><br>
        <em>Examples:</em>
        <br><code>--mongo</code>
        <br><code>-m</code>
      </td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>--devServerPort</code></td>
      <td align="center">-</td>
      <td>Number</td>
      <td>
        Port number to the webpack development server. You'll visit the app locally at <code>http://localhost:&lt;devServerPort&gt;</code>.
        <br>Note: <code>apiPort</code> takes priority over <code>devServerPort</code>. In the event they are both the same, <code>devServerPort</code> will automatically be adjusted.
        <br><br>
        <em>Examples:</em>
        <br><code>--devServerPort 1234</code>
        <br><code>--devServerPort=1234</code>
      </td>
      <td><code>8080</code></td>
    </tr>
    <tr>
      <td><code>--apiPort</code></td>
      <td align="center">-</td>
      <td>Number</td>
      <td>
        Port number to the webpack development server. You'll visit the app locally at <code>http://localhost:&lt;devServerPort&gt;</code>.
        <br><br>
        <em>Examples:</em>
        <br><code>--devServerPort 1234</code>
        <br><code>--devServerPort=1234</code>
      </td>
      <td><code>3000</code></td>
    </tr>
    <tr>
      <td><code>--mongoPort</code></td>
      <td align="center"><code>--mp</code></td>
      <td>Number</td>
      <td>
        Port number that MongoDB connects on. If you haven't <span style="font-style: italic;">specifically</span> set MongoDB's port when you installed it locally, simply leave this alone and use the default value.
        <br><br>
        <em>Examples:</em>
        <br><code>--mongoPort 30123</code>
        <br><code>--mongoPort=30123</code>
        <br><code>--mp 30123</code>
        <br><code>--mp=30123</code>
      </td>
      <td><code>27017</code></td>
    </tr>
    <tr>
      <td><code>--mongoPortProd</code></td>
      <td align="center"><code>--mpp</code></td>
      <td>Number</td>
      <td>
        Port number that MongoDB connects to <span style="font-style: italic;"><strong>in production</strong></span>. This value <span style="font-style: italic;">should</span> be different than the default value when using MongoDB in production. It defaults to <code>27017</code> in case you didn't change the port in your production environment. But for security reasons, do yourself the favor and don't use the default value in production.
        <br><br>
        <em>Examples:</em>
        <br><code>--mongoPortProd 30123</code>
        <br><code>--mongoPortProd=30123</code>
        <br><code>--mpp 30123</code>
        <br><code>--mpp=30123</code>
      </td>
      <td><code>27017</code></td>
    </tr>
    <tr>
      <td><code>--mongoUser</code></td>
      <td align="center"><code>--mu</code></td>
      <td>String</td>
      <td>
        CNA is set up to to use authentication in production with MongoDB. This sets the user value. You will also need to set a user password, but there's no cli option. Nobody should type a password into a cli! The variable <code>MONGO_USER_PASSWORD</code> will be available in the <code>.env</code> file, but will not be set. Set it manually. See <code>cna --mongoHelp</code> for more information.
        <br><br>
        <em>Examples:</em>
        <br><code>--mongoUser mongo_master</code>
        <br><code>--mongoUser=mongo_master</code>
        <br><code>--mu mongo_master</code>
        <br><code>--mu=mongo_master</code>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td><code>--mongoAuthSource</code></td>
      <td align="center"><code>--mas</code></td>
      <td>String</td>
      <td>
        CNA is set up to to use authentication in production with MongoDB. This sets the database name for MongoDB to authenticate against. See <code>cna --mongoHelp</code> for more information.
        <br><br>
        <em>Examples:</em>
        <br><code>--mongoAuthSource admin</code>
        <br><code>--mongoAuthSource=admin</code>
        <br><code>--mas admin</code>
        <br><code>--mas=admin</code>
      </td>
      <td>-</td>
    </tr>
  </tbody>
</table>

### package.json options

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Alias</th>
      <th>Type</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="160px"><code>--author</code></td>
      <td width="90px" align="center">-</td>
      <td>String</td>
      <td>Populates package.json field name of the same value.</td>
      <td><code>''</code></td>
    </tr>
    <tr>
      <td><code>--description</code></td>
      <td align="center">-</td>
      <td>String</td>
      <td>Populates package.json field name of the same value.</td>
      <td><code>''</code></td>
    </tr>
    <tr>
      <td><code>--email</code></td>
      <td align="center">-</td>
      <td>String</td>
      <td>Populates package.json field name of the same value.</td>
      <td><code>''</code></td>
    </tr>
    <tr>
      <td><code>--keywords</code></td>
      <td align="center">-</td>
      <td>Array</td>
      <td>Populates package.json field name of the same value.<br>Example:<br><code>--keywords one two three</code></td>
      <td><code>[]</code></td>
    </tr>
    <tr>
      <td><code>--browserslist</code></td>
      <td><code>--bl</code></td>
      <td>Array</td>
      <td>Populates package.json field name of the same value. This field is used by <a href="https://babeljs.io/docs/en/babel-preset-env#browserslist-integration">@babel/preset-env</a> and <a href="https://github.com/postcss/autoprefixer#browsers">autoprefixer</a>.The default value is aimed at supporting modern browsers only. Also, using <code>last 2 versions</code> <a href="http://bit.ly/2Z5pejA">might not do what you think.</a></td>
      <td><code>['>0.25%', 'not ie 11', 'not op_mini all']</code></td>
    </tr>
    <tr>
      <td><code>--repository</code></td>
      <td><code>--repo</code></td>
      <td>Array</td>
      <td>Populates package.json field name of the same value.</td>
      <td><code>''</code></td>
    </tr>
  </tbody>
</table>


### Information-only

| Option | Alias | Description |
| ------ | ----- | ----------- |
| `--help` | `-h` | Outputs the help screen, showing all the above documented options. |
| `--mongoHelp` | `--mh` | Outputs some helpful information about getting MongoDB prepared for production. |
| `--version` | `-v` | Outputs the version of CNA that you're using to the terminal. |


### Other options

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Alias</th>
      <th>Type</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="125px"><code>--offline</code></td>
      <td><code>-o</code></td>
      <td>Boolean</td>
      <td>
        Forces npm to use cache when installing. Great if you don't want npm hogging your data. Tethering, anyone?
        <br><br>
        <em>Examples:</em>
        <br><code>--offline</code>
        <br><code>-o</code>
      </td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>--force</code></td>
      <td><code>-f</code></td>
      <td>Boolean</td>
      <td>
        Want to install an app in a pre-existing folder? Use this. But be warned! There's a possibility you can overwrite files if the names conflict!
        <br><br>
        <em>Examples:</em>
        <br><code>--force</code>
        <br><code>-f</code>
      </td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>--sandbox</code></td>
      <td><code>-s</code></td>
      <td>Boolean</td>
      <td>
        Creates a "sandbox" app which consists of 3 simple files:
        <ul>
          <li>index.html</li>
          <li>styles.css</li>
          <li>main.js</li>
        </ul>
        If you use this option, everything else will be ignored. This option is perfect for whipping up a quick directory with some files to play in.
        <br><br>
        <em>Examples:</em>
        <br><code>--sandbox</code>
        <br><code>-s</code>
      </td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>--title</code></td>
      <td><code>-t</code></td>
      <td>String</td>
      <td>
        Sets the webpage title generated by Webpack's <code>HtmlWebpackPlugin</code>.
        <br><br>
        <em>Examples:</em>
        <br><code>--title 'JavaScript Rules'</code>
        <br><code>--title='JavaScript Rules'</code>
        <br><code>-t 'JavaScript Rules'</code>
        <br><code>-t='JavaScript Rules'</code>
      </td>
      <td>Title-cased version of the app name.</td>
    </tr>
  </tbody>
</table>


## TODO's

- [ ] Implement PWA's by default with CLI option to disable
- [ ] Create `man` documentation for use in `package.json` - http://bit.ly/2Z5tCiy
