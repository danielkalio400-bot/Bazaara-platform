module.exports = ({ config }) => {
  // Cleartext is opt-in. Production defaults to HTTPS-only even if an environment
  // variable is accidentally omitted; development/internal profiles explicitly set 1.
  const allowCleartext = process.env.BAZAARA_ALLOW_CLEARTEXT === "1";

  const originalPlugins = Array.isArray(config.plugins)
    ? config.plugins
    : [];

  let existingBuildProperties = {};
  const remainingPlugins = [];

  for (const plugin of originalPlugins) {
    const isBuildPropertiesString =
      plugin === "expo-build-properties";

    const isBuildPropertiesTuple =
      Array.isArray(plugin) &&
      plugin[0] === "expo-build-properties";

    if (isBuildPropertiesString) {
      continue;
    }

    if (isBuildPropertiesTuple) {
      const values = plugin[1] || {};

      existingBuildProperties = {
        ...existingBuildProperties,
        ...values,
        android: {
          ...(existingBuildProperties.android || {}),
          ...(values.android || {}),
        },
        ios: {
          ...(existingBuildProperties.ios || {}),
          ...(values.ios || {}),
        },
      };

      continue;
    }

    remainingPlugins.push(plugin);
  }

  return {
    ...config,

    ios: {
      ...(config.ios || {}),
      infoPlist: {
        ...((config.ios && config.ios.infoPlist) || {}),
        NSAppTransportSecurity: {
          ...(((config.ios && config.ios.infoPlist) || {}).NSAppTransportSecurity || {}),
          NSAllowsArbitraryLoads: allowCleartext,
        },
      },
    },

    plugins: [
      ...remainingPlugins,

      [
        "expo-build-properties",
        {
          ...existingBuildProperties,

          android: {
            ...(existingBuildProperties.android || {}),
            usesCleartextTraffic: allowCleartext,
          },

          ios: {
            ...(existingBuildProperties.ios || {}),
          },
        },
      ],
    ],
  };
};