// Déclare les messageries dans les <queries> du manifeste Android (visibilité des paquets, Android 11+),
// pour que Linking.canOpenURL puisse savoir si elles sont installées (US-17 CA3).
// Équivalent Android de LSApplicationQueriesSchemes sur iOS (architecture.pdf, « Messageries prises en charge »).
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withMessagingQueries(config, { schemes = [] } = {}) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries ?? [];

    const declared = new Set(
      manifest.queries.flatMap((q) => (q.intent ?? []).flatMap((i) => (i.data ?? []).map((d) => d.$['android:scheme']))),
    );
    const intents = schemes
      .filter((scheme) => !declared.has(scheme))
      .map((scheme) => ({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        data: [{ $: { 'android:scheme': scheme } }],
      }));

    if (intents.length > 0) manifest.queries.push({ intent: intents });
    return cfg;
  });
};
