// Sentry's Metro wrapper (adds source-map support for readable native stack traces). It extends
// the default Expo Metro config, so web (expo export) and native builds both work unchanged.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

module.exports = config;
