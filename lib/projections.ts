import { geoAlbersUsa, geoMercator, geoPath } from "d3-geo";

// US states map projection.
export const usProjection = geoAlbersUsa().scale(900).translate([480, 300]);

// North America (Canada + US) Mercator projection.
export const naProjection = geoMercator()
  .center([-96, 52])
  .scale(420)
  .translate([480, 220]);

// Europe centered, fits the EU + UK + nearby comfortably in 960x600.
export const euProjection = geoMercator()
  .center([15, 52])
  .scale(620)
  .translate([480, 300]);

// Asia + Oceania centered. Pulled south and zoomed out a touch from the
// original framing so Australia, New Zealand, and PNG fit in the viewport
// alongside East/Southeast/South Asia.
export const asiaProjection = geoMercator()
  .center([110, 12])
  .scale(310)
  .translate([480, 320]);

export const usPath = geoPath(usProjection);
export const naPath = geoPath(naProjection);
export const euPath = geoPath(euProjection);
export const asiaPath = geoPath(asiaProjection);
