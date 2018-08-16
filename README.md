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

You want to make apps. You want to make apps with [React](https://reactjs.org/). Excellent choice.

[Create React App](https://github.com/facebookincubator/create-react-app) is awesome, no doubt, but you find yourself constantly tweaking files to get [SCSS](http://sass-lang.com/) included. And wouldn't you know it? Your app needs an API - so you look to [Express](https://expressjs.com/). Heck, you might _already have_ an API! But how to integrate it? And to top it off, you like using JavaScript up and down the stack, so your persistence layer is [MongoDB](https://mongodb.github.io/node-mongodb-native/). But CRA doesn't give you all of this out of the box. What's a developer to do?

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
^^^ #Boom. Your app is running on `http://localhost:3000`.

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

This will generate 3 empty files for you:
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

This is an obvious one. You're developing, right? Well, you're in luck. Webpack is running a development server that defaults to port 3000. Make changes to your JS or SCSS files and let Webpack refresh that screen.

### Tree Shaking / Minification

Delivers super-sexy minified JavaScript without those dead branches! Your CSS is purged & minified as well. #Bandwidth

### Babel

Write ES6+ and beyond. Babel is integrated so you'll get ES5 once you run a build. Be sure to check out the `entry.js` file and see if you need `@babel/polyfill` or not.

### Postcss

SCSS is included and get's compiled down to CSS. But that's half the magic. [Postcss](https://github.com/postcss/postcss) is [autoprefixing](https://github.com/postcss/autoprefixer) our styles, smartly grouping [media queries](https://github.com/hail2u/node-css-mqpacker) together, [combining](https://github.com/ChristianMurphy/postcss-combine-duplicated-selectors) redudant selectors, [removing](https://github.com/ben-eb/postcss-discard-comments) comments, and [sorting](https://github.com/Siilwyn/css-declaration-sorter) properties for better gzip compression! It's also [purging](https://github.com/FullHuman/postcss-purgecss) unused css (see below).

### Purgecss

Automatically [removes unused CSS](https://www.purgecss.com/)! It's only triggered when you run a build for production, so you can still hack away in Chrome's console and have access to all your styles. Also included is the [purgecss-whitelister](https://github.com/qodesmith/purgecss-whitelister) to prevent CSS from 3rd party tools being removed that you want to keep.

### CleanWebpackPlugin

[CleanWebpackPlugin](https://goo.gl/xP7eDB) is used to clean the `dist` folder when running a build. It's the folder that will contain your app's bundled assets.

### MiniCssExtractPlugin

[MiniCssExtractPlugin](https://goo.gl/pvSAek) removes the CSS data that's in the JS bundle and extracts it into a CSS file. This is the recommended plugin to use instead of the old [extract text webpack plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin).

### HtmlWebpackPlugin

[HtmlWebpackPlugin](https://goo.gl/og4sNK) generates the `index.html` file. Dynamically creates a `<style>` tag in the `<head>` of the document and a `<script>` tag before the closing `<body>` tag, referencing the build assets.


## Options

### Redux option

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


### React Router option

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


### API server options

When you need a back end for your app, you need an API server. The purpose of an API server is to receive proxied requests from Webpack's development server. If you have a pre-existing api already, simply use the `--api` option. Otherwise, an Express server will be set up for you with either the `--express` or `--mongo` options.

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
      <td width="165px"><code>--api</code></td>
      <td align="center">-</td>
      <td>String</td>
      <td>
        Sets the key value to <code>devServer.proxy[api]</code> in <code>webpack.config.js</code>. Used when you have a local back-end you'd like to proxy requests to while developing.
        <br><br>
        <em>Examples:</em>
        <br><code>--api /api</code>
        <br><code>--api=/api</code>
      </td>
      <td><code>/</code></td>
    </tr>
    <tr>
      <td><code>--apiPort</code></td>
      <td align="center">-</td>
      <td>Number</td>
      <td>
        Port number to the api server.
        <br><br>
        <em>Examples:</em>
        <br><code>--apiPort 5000</code>
        <br><code>--apiPort=5000</code>
      </td>
      <td><code>8080</code></td>
    </tr>
    <tr>
      <td><code>--devServerPort</code></td>
      <td align="center">-</td>
      <td>Number</td>
      <td>
        Port number to the development server.<br>
        Note: The `apiPort` takes priority over the `devServerPort`. In the event that they are both the same, `devServerPort` will be incremented by 1.
        <br><br>
        <em>Examples:</em>
        <br><code>--devServerPort 2000</code>
        <br><code>--devServerPort=2000</code>
      </td>
      <td><code>3000</code></td>
    </tr>
    <tr>
      <td><code>--express</code></td>
      <td align="center"><code>-e</code></td>
      <td>Boolean</td>
      <td>
        Set up a local Express api server with Node.
        <br><br>
        <em>Examples:</em>
        <br><code>--express</code>
        <br><code>-e</code>
      </td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>--mongo</code></td>
      <td align="center"><code>-m</code></td>
      <td>Boolean</td>
      <td>
        Set up MongoDB with a local Express api server on Node.
        <br><br>
        <em>Examples:</em>
        <br><code>--mongo</code>
        <br><code>-m</code>
      </td>
      <td><code>false</code></td>
    </tr>
  </tbody>
</table>

### package.json options

| Option | Type | Description | Default |
| ------ | ---- | ----------- | ------- |
| `--author` | String | Populates package.json field name of the same value. | `''` |
| `--description` | String | Populates package.json field name of the same value. | `''` |
| `--email` | String | Populates package.json field name of the same value. | `''` |
| `--keywords` | String | Populates package.json field name of the same value. | `[]` |

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
  </tbody>
</table>


## TODO's

- [x] Include Redux as an option ~~(or default?)~~
- [x] Include ~~`redux-first-router`~~ React Router as an option
- [ ] Implement PWA's by default with CLI option to disable
- [ ] Implement ~~Jest~~ [Cypress](https://www.cypress.io/) along with a test for the generated components
- [ ] Create `man` documentation for use in `package.json` - https://goo.gl/64HeiV
