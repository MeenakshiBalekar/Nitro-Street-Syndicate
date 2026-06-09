// Default Expo Metro config. The 3D scene is built from three.js primitives, so
// no extra asset extensions (glTF/textures) are required here.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
