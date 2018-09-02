const path = require('path')

/*
  THIS ROUTE WILL ONLY GET HIT WHEN SOMEONE NAVIGATES TO A
  NON-EXISTENT ROUTE. THE FRONT END SHOULD DIRECT TO A 404 ROUTE.
*/

function home(req, res) {
  /*
    This folder & file will exist after you have run `npm run build`.
    While developing, the development server will serve `index.html`
    from memory, avoiding any contact with this route in the first place.
  */
  res.sendFile(path.resolve(__dirname, '../dist/index.html'), err => {
    /*
      If the file wasn't found, send 404.
      This can happen in you manually change
      the url to something non-existant
    */
    if (err) res.sendStatus(404)
  })
}

module.exports = home
