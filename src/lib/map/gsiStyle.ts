import type { StyleSpecification } from "maplibre-gl";

export const gsiAerialStyle: StyleSpecification = {
  version: 8,
  sources: {
    "gsi-aerial": {
      type: "raster",
      tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
      tileSize: 256,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">地理院タイル</a>',
    },
  },
  layers: [
    {
      id: "gsi-aerial",
      type: "raster",
      source: "gsi-aerial",
      paint: {
        "raster-saturation": 0.12,
        "raster-contrast": 0.06,
      },
    },
  ],
};
