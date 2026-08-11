/** Identifica de forma única una combinación del guion de demo. */
export function fixtureKey(ids: {
  zoneId: string;
  productId: string;
  objective: string;
  networkId: string;
}): string {
  return [ids.zoneId, ids.productId, ids.objective, ids.networkId].join("|");
}
