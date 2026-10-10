/** Product taxonomy, not classical authority or permission to score.
 * First scope is the default; narrower scopes never inherit evidence automatically.
 * Keep lexical phrases and source-specific operative clauses in their own datasets.
 */
export const ACTIVITY_SCOPES = {
  worship: ['worship'],
  pray_blessing: ['pray_blessing'],
  pray_children: ['pray_children'],
  wedding: ['relationship_wedding'],
  engagement: ['engagement'],
  moving: ['home_moving'],
  bed_installation: ['bed_installation'],
  opening: ['business_opening'],
  business: ['business'],
  contract: ['contract'],
  transaction: ['transaction'],
  finance: ['finance'],
  travel: ['travel_general', 'travel_road'],
  meeting: ['meeting'],
  study: ['study'],
  medical: ['medical'],
  cleaning: ['cleaning'],
  cut_hair: ['cut_hair'],
  groundbreaking: ['construction_groundbreaking'],
  construction: ['construction_general'],
  renovation: ['renovation'],
  beam_raising: ['beam_raising'],
  warehouse: ['warehouse'],
  planting: ['planting'],
  livestock: ['livestock'],
  burial: ['funeral_burial'],
  demolition: ['construction_demolition'],
  water_travel: ['travel_water'],
  grave_repair: ['funeral_grave_repair'],
} as const satisfies Record<string, readonly string[]>

export type ActivityId = keyof typeof ACTIVITY_SCOPES
export type ActivityScopeResolution = {
  status: 'exact' | 'unmapped' | 'incompatible'
  activityId: string
  scope: string
}

function scopesFor(activityId: string): readonly string[] | undefined {
  return Object.hasOwn(ACTIVITY_SCOPES, activityId)
    ? ACTIVITY_SCOPES[activityId as ActivityId]
    : undefined
}

export function getActivityScope(activityId: string): string | undefined {
  return scopesFor(activityId)?.[0]
}

/** No score, polarity, conditions, exceptions or authority is inferred here. */
export function resolveActivityScope(activityId: string, scope: string): ActivityScopeResolution {
  const scopes = scopesFor(activityId)
  return {
    status: !scopes ? 'unmapped' : scopes.includes(scope) ? 'exact' : 'incompatible',
    activityId,
    scope,
  }
}
