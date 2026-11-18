const SCAN_MODE_PRESETS = {
  quick: {
    scanDepthMultiplier: 3,
    minScanDepth: 30,
    maxScrollPasses: 3,
    allowSeenRescue: false,
  },
  deep: {
    scanDepthMultiplier: 8,
    minScanDepth: 100,
    maxScrollPasses: 8,
    allowSeenRescue: true,
  },
};

export function getScanModePreset(filters = {}) {
  const requested = filters.scanMode || filters.scan_mode || filters.mode || 'quick';
  const scanMode = SCAN_MODE_PRESETS[requested] ? requested : 'quick';
  return { scanMode, ...SCAN_MODE_PRESETS[scanMode] };
}
