
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// 1. Load the default Expo Metro configuration.
const config = getDefaultConfig(__dirname);

// 2. Connect NativeWind to the existing global CSS file.
module.exports = withNativeWind(config, {
  input: "./src/global.css",
});
