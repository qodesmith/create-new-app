function MiniCssExtractPluginMockFunction(options) {
  for (let i in options) this[i] = options[i]
}

MiniCssExtractPluginMockFunction.loader = 'MINI_CSS_EXTRACT_PLUGIN_MOCK_FUNCTION.LOADER'

module.exports = MiniCssExtractPluginMockFunction
