<!--
  README inspired by:
  * https://github.com/google/web-starter-kit
  * https://github.com/facebookincubator/create-react-app

  TODO - look at https://github.com/kriasoft/react-starter-kit
-->

# Create New App

You want to make apps. You want to make apps with [React](https://reactjs.org/). Excellent choice.

[Create React App](https://github.com/facebookincubator/create-react-app) is awesome, no doubt, but you find yourself constantly tweaking files to get [SCSS](http://sass-lang.com/) included. And you've been hip to [Tachyons](http://tachyons.io/) for some time now, but alas... CRA doesn't include it. And wouldn't you know it? Your app needs an API - so you look to [Express](https://expressjs.com/). Heck, you might _already have_ an API! But how to integrate it? And to top it off, you like using JavaScript up and down the stack, so your persistence layer is [MongoDB](https://mongodb.github.io/node-mongodb-native/). But CRA doesn't give you all of this out of the box. What's a developer to do? **[Create New App](https://github.com/qodesmith/create-new-app)**, _that's_ what you do!

It's just like CRA but with full stack options. You get a [Webpack](https://webpack.js.org/configuration/) development server and build which ties all-the-things together. Don't need some of the goodies included? No worries! A few CLI flags and you're off to the web development races with whatever it is you _do_ need. No ejecting either. Everything is set up for you, loaded with comments and links, and ready for your tweaking - or not. You're gonna like this. I promise.

## Installation

```
npm install -g create-new-app
```

## Usage

```
create-new-app <app-name> [options]
```

### Simplest Example

```
create-new-app awesomeness
cd awesomeness
npm start
```
^^^ #Boom. Your app is running on `http://localhost:3000`. Simple, no? Let's look at some other examples...

### Other Examples

```
# You already have a local API built & running at `localhost:1234`:
create-new-app awesomeness --apiport 1234

# Perhaps all requests to that local api are behind the `/api` flag:
create-new-app awesomeness --api /api --apiport 1234

# You've decided you want a new API. Express is set up for you:
create-new-app awesomeness -e

# You want a new API with MongoDB wired up & ready to go:
create-new-app awesomeness -m
```

## Webpack Magic

While Webpack certainly seems like magic, let's just go over what that "magic" is doing for you in this project.

#### Development Server

This is an obvious one. You're developing, right? Well, you're in luck. Webpack is running a development server that defaults to port 3000. Make changes to your JS or SCSS files and let the Webpack refresh that screen.

#### Babel

Write ES6+ and beyond. Babel is integrated so you'll get ES5 once you run a build.

#### Postcss

SCSS is included and get's compiled down to CSS. But that's half the magic. [Postcss](https://github.com/postcss/postcss) is [autoprefixing](https://github.com/postcss/autoprefixer) our styles and smartly grouping [media queries](https://github.com/hail2u/node-css-mqpacker) together.

#### PurifyCSS

Automatically [removes unused CSS](https://github.com/webpack-contrib/purifycss-webpack)! It's not an [exact](https://goo.gl/nznWhV) science, but hey, it's something. And it's only triggered when you run a build for production, so you can still hack away in Chrome's console and have access to all your styles.

#### UglifyJsPlugin

[UglifyJsPlugin](https://goo.gl/sB6d6b) delivers super-sexy minified JavaScript.

#### WebpackCleanupPlugin

[WebpackCleanupPlugin](https://goo.gl/hTXPtE) is used to destroy & rebuild the `dist` folder each build. It's the folder that will contain your app's bundled assets.

#### ExtractTextPlugin

[ExtractTextPlugin](https://goo.gl/rHd8B2) removes the css data that's in the JS bundle and extracts it into a css file.

#### HtmlWebpackPlugin

[HtmlWebpackPlugin](https://goo.gl/og4sNK) generates the `index.html` file. Dynamically creates a `<style>` tag in the `<head>` of the document and a `<script>` tag before the closing `<body>` tag, referencing the build assets.

## Options

### API server options

The purpose of an API server is to receive proxied requests from Webpack's development server. When you need a back end for your app, you need an API server. If you have a pre-existing one already, simply use the `--api` option. Otherwise, an Express server will be set up for you with either the `--express` or `--mongo` option.

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
      <td width="125px"><code>--api</code></td>
      <td align="center">-</td>
      <td>String</td>
      <td>
        Sets the key value to <code>devServer.proxy[api]</code> in <code>webpack.config.js</code>. Used when you have a local back-end you'd like to proxy requests to while developing.
        <br><br>
        <em>Examples:</em>
        <br><code>--api /api</code>
        <br><code>--api=/api</code>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td><code>--apiport</code></td>
      <td align="center">-</td>
      <td>Number</td>
      <td>
        Port number to the api server.
        <br><br>
        <em>Examples:</em>
        <br><code>--apiport 5000</code>
        <br><code>--apiport=5000</code>
      </td>
      <td>8080</td>
    </tr>
    <tr>
      <td><code>--express</code></td>
      <td align="center"><code>-e</code></td>
      <td>Boolean</td>
      <td>
        Set up a local Express api server on with Node.
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
    <tr>
      <td><code>--port</code></td>
      <td align="center"><code>-p</code></td>
      <td>Number</td>
      <td>
        Port number to the development server.
        <br><br>
        <em>Examples:</em>
        <br><code>--port 2000</code>
        <br><code>--port=2000</code>
        <br><code>-p 2000</code>
        <br><code>-p=2000</code>
      </td>
      <td>3000</td>
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
        Forces npm to use cache when installing. Great if you don't want npm hogging your data (tethering, anyone?).
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
  </tbody>
</table>

## TODO's

* Implement PWA's by default with CLI option to disable
* Implement Jest along with a test for the `App.js` example component
