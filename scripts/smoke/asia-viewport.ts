import { geoMercator } from "d3-geo";
const p = geoMercator().center([110, 12]).scale(310).translate([480, 320]);
const corners: Array<[string, [number, number]]> = [
  ["N India", [78, 28]],
  ["Tokyo", [139, 35]],
  ["Seoul", [127, 37]],
  ["Beijing", [116, 40]],
  ["Ulaanbaatar", [107, 47]],
  ["Singapore", [104, 1]],
  ["Jakarta", [107, -6]],
  ["Sydney", [151, -34]],
  ["Perth", [116, -32]],
  ["Darwin", [131, -12]],
  ["Auckland", [175, -37]],
  ["Hobart", [147, -43]],
];
for (const [label, c] of corners) {
  const pt = p(c);
  const inside = pt && pt[0] >= 0 && pt[0] <= 960 && pt[1] >= 0 && pt[1] <= 600;
  console.log(`  ${label.padEnd(12)} ${pt ? `(${pt[0].toFixed(0)}, ${pt[1].toFixed(0)})` : "null"} ${inside ? "✓" : "✗"}`);
}
