export const isDemoOtpEnabled = (configuredValue?: string): boolean =>
  String(configuredValue ?? 'true').trim().toLowerCase() !== 'false'
