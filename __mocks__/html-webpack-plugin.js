function CleanWebpackPluginMockFunction(options) {
  for (let i in options) this[i] = options[i]
}

module.exports = CleanWebpackPluginMockFunction
