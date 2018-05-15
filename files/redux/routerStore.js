import { connectRoutes } from 'redux-first-router'
import { combineReducers, createStore, applyMiddleware, compose } from 'redux'
import createHistory from 'history/createBrowserHistory'
import routesMap from './routesMap'
import exampleReducer from 'reducers/exampleReducer'

const history = createHistory()
const { reducer: locationReducer, middleware, enhancer } = connectRoutes(history, routesMap)

// Add all your custom middleware to this array.
const middlewareList = [middleware]

// Add all your reducers to this object.
const rootReducer = combineReducers({
  location: locationReducer,
  example: exampleReducer
})

// https://goo.gl/XRLgX8
// Using Redux DevTools extension? You should...
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

// Create the Redux store, in all its router-ified glory!
const store = createStore(
  rootReducer,
  composeEnhancers(
    enhancer,
    applyMiddleware(...middlewareList)
  )
)

export default store
