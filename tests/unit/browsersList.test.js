const browsersList = require('../../modules/browserslist')


describe('browserslist', () => {
  it('should export the corrent browsersList array', () => {
    expect(browsersList).toEqual(['>0.25%', 'not ie 11', 'not op_mini all'])
  })
})
