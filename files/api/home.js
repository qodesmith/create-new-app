const path = require('path');
const { naughtyAjax } = require('./utilities/handleErrors');
const isProd = process.env.NODE_ENV === 'production';

/*
  THIS ROUTE WILL ONLY GET HIT WHEN SOMEONE NAVIGATES TO A
  NON-EXISTENT ROUTE. THE FRONT END SHOULD DIRECT TO A 404 ROUTE.
*/

function home(req, res) {
  // AJAX requests that request non-existent routes.
  if (req.xhr) {
    if (!isProd) naughtyAjax(req);
    res.json({ nothing: 'to see here' });
  } else {
    res.sendFile(path.resolve(__dirname, '../dist/index.html'));
  }
}

module.exports = home;
