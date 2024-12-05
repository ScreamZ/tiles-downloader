import pThrottle, { type Options } from "p-throttle";

type TilesDownloadConfig = {
  url: string;
  zoomLevels: number[];
  throttleConfig?: Options;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
};

function lonToTileX(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}

function latToTileY(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      2 ** zoom
  );
}

async function downloadTile(
  url: string,
  z: number,
  x: number,
  y: number
): Promise<ArrayBuffer> {
  const response = await fetch(
    url
      .replace("{z}", z.toString())
      .replace("{x}", x.toString())
      .replace("{y}", y.toString())
  );

  if (!response.ok) {
    throw new Error(`Failed to download tile ${z}/${x}/${y}`);
  }

  return response.arrayBuffer();
}

/**
 * Compute the list of tiles that are within the specified bounds and zoom levels.
 *
 * @param config
 * @returns An array of tile coordinates.
 */
export function computeTiles(
  config: Pick<TilesDownloadConfig, "bounds" | "zoomLevels">
): Array<{ x: number; y: number; z: number }> {
  const tiles: Array<{ x: number; y: number; z: number }> = [];

  for (const zoom of config.zoomLevels) {
    const minX = lonToTileX(config.bounds.minLon, zoom);
    const maxX = lonToTileX(config.bounds.maxLon, zoom);
    const minY = latToTileY(config.bounds.maxLat, zoom);
    const maxY = latToTileY(config.bounds.minLat, zoom);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
  }

  return tiles;
}

/**
 * Download all tiles within the specified bounds and zoom levels.
 *
 * @param config
 * @param onTile A callback that will be called for each downloaded tile allowing you to process the tile data.
 *
 * @returns A promise that resolve when the callback has been called for all tiles and resolved.
 */
export async function downloadTiles(
  config: TilesDownloadConfig,
  onTile: (tile: {
    x: number;
    y: number;
    z: number;
    buffer: ArrayBuffer;
  }) => void
): Promise<void> {
  const tiles = computeTiles(config);

  const downloadTileThrottled = pThrottle(
    config.throttleConfig ?? { limit: 100, interval: 1000 }
  )(downloadTile);

  await Promise.all(
    tiles.map((tile) =>
      downloadTileThrottled(config.url, tile.z, tile.x, tile.y).then((buffer) =>
        onTile({
          ...tile,
          buffer,
        })
      )
    )
  );
}
