function TerserPluginMockFunction(options) {
  for (let i in options) this[i] = options[i]
}

module.exports = TerserPluginMockFunction
