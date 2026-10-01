import { Body, HourAngle, Observer } from 'astronomy-engine'

function signedDayDifference(value: number): number {
  let result = value
  while (result > 43_200) result -= 86_400
  while (result <= -43_200) result += 86_400
  return result
}

function localIso(epochMs: number): string {
  return new Date(epochMs).toISOString().replace('Z', '').slice(0, 23)
}

export function calculateTrueSolarTime(
  instantUtc: string,
  longitude: number,
  offsetMinutes: number,
  latitude = 0,
) {
  const instant = new Date(instantUtc)
  if (!Number.isFinite(instant.getTime())) throw new RangeError('Invalid UTC instant')
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    throw new RangeError('Invalid longitude')
  const apparentSeconds =
    ((HourAngle(Body.Sun, instant, new Observer(latitude, longitude, 0)) + 12) % 24) * 3600
  const civilEpoch = instant.getTime() + offsetMinutes * 60_000
  const civil = new Date(civilEpoch)
  const civilSeconds =
    civil.getUTCHours() * 3600 + civil.getUTCMinutes() * 60 + civil.getUTCSeconds()
  const totalCorrectionSeconds = signedDayDifference(apparentSeconds - civilSeconds)
  const longitudeCorrectionSeconds = longitude * 240 - offsetMinutes * 60
  const equationOfTimeSeconds = totalCorrectionSeconds - longitudeCorrectionSeconds
  return {
    tstDateTime: localIso(civilEpoch + totalCorrectionSeconds * 1000),
    longitudeCorrectionSeconds,
    equationOfTimeSeconds,
    totalCorrectionSeconds,
    engineErrorBoundSeconds: 30,
    engineVersion: 'astronomy-engine@2.1.19' as const,
  }
}
