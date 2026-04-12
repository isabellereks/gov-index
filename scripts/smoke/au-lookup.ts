import { getEntity, getEntitiesByRegion } from "../../lib/placeholder-data.js";
console.log("by geoId 36 in asia:", getEntity("36", "asia")?.name ?? "null");
const asia = getEntitiesByRegion("asia");
console.log("total asia entities:", asia.length);
console.log("asia geoIds:", asia.map(e => `${e.name}=${e.geoId}`).join(", "));
