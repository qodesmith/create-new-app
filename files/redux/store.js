import { combineReducers, createStore, applyMiddleware, compose } from 'redux'
import app from 'reducers/appReducer'


// Add all your custom middleware to this array.
const middlewareList = []

// Add all your reducers to this object.
const rootReducer = combineReducers({ app })

/*
  http://bit.ly/2XqEeYM
  Using Redux DevTools extension? You should...
  If we're connecting a mobile device to our local machine running the app,
  then we may have an issue with Redux DevTools not being installed.
  The below logic takes care of that.
*/
const composeEnhancers = !__PROD__ ? (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose) : compose

// Create the Redux store in all its glory!
const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(...middlewareList))
)

export default store
