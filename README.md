# Tiles downloader

> [!IMPORTANT]
> This module is ESM only.

This module allows you to download tiles from a tile server. Therefore you can use it to download tiles from OpenStreetMap, etc. for offline use or caching.

## Installation

```sh
npm install @codingspark/tiles-downloader
```

## Example usage

### Tiles downloading

Generic tiles download using `fetch` that works in browser and most server environments.

```ts
import path from "node:path";
import { downloadTiles } from "@codingspark/tiles-downloader";

await downloadTiles(
  {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    zoomLevels: [14, 15, 16],
    throttleConfig: { limit: 3, interval: 1000 },
    bounds: {
      minLat: 43.5704,
      maxLat: 43.645,
      minLon: 3.8095,
      maxLon: 3.923,
    },
  },
  async ({ x, y, z, buffer }) => {
    const outputPath = path.join(
      "./map",
      z.toString(),
      x.toString(),
      `${y}.png`
    );

    console.log(`Writing tile ${z}/${x}/${y}`);

    // Using bun but use anything you want to write the buffer to a file
    Bun.write(outputPath, buffer);
  }
);
```

### Generate tiles for a specific area

This can be useful if you want to only get tiles for a specific need or you want to manage downloading tiles by yourself.

```ts
import { computeTiles } from "@codingspark/tiles-downloader";

const tiles = computeTiles({
  bounds: {
    minLat: 43.5704,
    maxLat: 43.645,
    minLon: 3.8095,
    maxLon: 3.923,
  },
  zoomLevels: [14, 15, 16],
});
```
