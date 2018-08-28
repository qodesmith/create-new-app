import { combineReducers, createStore, applyMiddleware, compose } from 'redux'
import home from 'reducers/homeReducer'


// Add all your custom middleware to this array.
const middlewareList = []

// Add all your reducers to this object.
const rootReducer = combineReducers({ home })

// https://goo.gl/XRLgX8
// Using Redux DevTools extension? You should...
const composeEnhancers = !__PROD__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose

// Create the Redux store in all its glory!
const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(...middlewareList))
)

export default store
