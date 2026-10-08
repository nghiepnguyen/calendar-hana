// clock-v1 lives with the production solar-term authority (one implementation,
// shared by the runtime table and this ERFA verifier).
export {
  CLOCK_POLICY_ID,
  CLOCK_V1_KNOWN_THROUGH_UTC_MS,
  ClockPolicyError,
  deltaTEspenakMeeusSeconds,
  serializeEpochMs,
  ttToCivil,
  type CivilInstant,
  type ClockRegime,
} from '../solarTerms/clock'
