/*
  Add your routes here. Also, don't forget to add the matching
  component to the `views` object in `App.js`.

  When a route matches, the key of the object is dispatched
  as an action. For example, navigating to '/' will dispatch `HOME`.
  This is used in conjunction with `App.js` to determine
  which component to render for any given route.

  The thunks associated with each route (optional) are just like
  pieces of middleware that will fire when that route is matched.
  You get access to the store's state & dispatch function.
*/
const routesMap = {
  HOME: '/',
  EXAMPLE2: '/another-page'
}

export default routesMap
