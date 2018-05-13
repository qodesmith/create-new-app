import { combineReducers, createStore, applyMiddleware, compose } from 'redux'
import exampleReducer from 'reducers/exampleReducer'


// Add all your custom middleware to this array.
const middlewareList = []

// Add all your reducers to this object.
const rootReducer = combineReducers({ example: exampleReducer })

// https://goo.gl/XRLgX8
// Using Redux DevTools extension? You should...
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

// Create the Redux store, in all its router-ified glory!
const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(...middlewareList))
)

export default store
