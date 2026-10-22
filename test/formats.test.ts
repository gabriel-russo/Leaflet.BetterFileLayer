import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createDefaultRegistry } from '@/formats';
import { GeoJsonFormat } from '@/formats/GeoJson.ts';
import { TopoJsonFormat } from '@/formats/TopoJson.ts';
import { CsvFormat } from '@/formats/CsvFormat.ts';
import { GpxFormat } from '@/formats/GpxFormat.ts';
import { KmlFormat } from '@/formats/KmlFormat.ts';
import { KmzFormat } from '@/formats/KmzFormat.ts';
import { WktFormat } from '@/formats/WktFormat.ts';
import { PolylineFormat } from '@/formats/PolylineFormat.ts';
import { ShapefileFormat } from '@/formats/ShapefileFormat.ts';
import { TextFileFormat, type ParsedData } from '@/formats/core.ts';
import type { BetterFileLayerControlOptions } from '@/types';
import type { FeatureCollection } from 'geojson';
import type { GeoJSON } from 'leaflet';

function file(path: string, name: string): File {
  return new File([readFileSync(path)], name);
}

/**
 * Minimal stand-in for a Leaflet GeoJSON layer that records what `load` adds.
 */
function fakeLayer(): { layer: GeoJSON; data: () => unknown } {
  let data: unknown;

  const layer = {
    addData: (value: unknown) => {
      data = value;
    },
  } as unknown as GeoJSON;

  return { layer, data: () => data };
}

const options = {} as BetterFileLayerControlOptions;

class UnparseableFormat extends TextFileFormat {
  readonly extensions = ['empty'];
  readonly label = 'Empty';

  protected parseText(): ParsedData | undefined {
    return undefined;
  }
}

test('Testing .TOPOJSON Parser', async () => {
  const parsedTopojson = await new TopoJsonFormat().parse(
    file('./test/fixtures/a.topojson', 'a.topojson'),
  );

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [3.1640625, 44.590318725160564],
            [22.497152058955894, 52.69656423444786],
            [26.3661327070207, 41.77131167976407],
            [36.56133972772277, 50.958048536151566],
            [62.22656249999999, 54.57206165565852],
          ],
        },
      },
    ],
  };

  return expect(parsedTopojson).toStrictEqual(expectedGeoJson);
});

test('Testing .CSV Parser | Without Options', async () => {
  const parsedCsv = await new CsvFormat().parse(file('./test/fixtures/a.csv', 'a.csv'), {
    latfield: 'lat',
    lonfield: 'lon',
    delimiter: ',',
  });

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Hello World',
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
      },
    ],
  };

  return expect(parsedCsv).toStrictEqual(expectedGeoJson);
});

test('Testing .CSV Parser | With Options', async () => {
  const options = {
    delimiter: ';',
    latfield: 'LATITUDE',
    lonfield: 'long',
  };

  const parsedCsv = await new CsvFormat().parse(file('./test/fixtures/b.csv', 'b.csv'), options);

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Hello World',
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
      },
    ],
  };

  return expect(parsedCsv).toStrictEqual(expectedGeoJson);
});

test('Testing .GPX Parser', async () => {
  const parsedGpx = await new GpxFormat().parse(file('./test/fixtures/a.gpx', 'a.gpx'));

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [6.05487864642, 44.907783722, 1298],
            [6.05518996909, 44.9077732488, 1301],
            [6.05547047546, 44.9077638115, 1308],
          ],
        },
      },
    ],
  };

  return expect(parsedGpx).toStrictEqual(expectedGeoJson);
});

test('Testing .KML Parser', async () => {
  const parsedKml = await new KmlFormat().parse(file('./test/fixtures/a.kml', 'a.kml'));

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-120.0822035425683, 37.42228990140251, 0],
        },
        properties: {
          name: 'Simple placemark two',
          description:
            'Attached to the ground. Intelligently places itself\n       at the height of the underlying terrain.',
          tessellate: '-1',
          extrude: '0',
          visibility: '-1',
        },
      },
    ],
  };

  return expect(parsedKml).toStrictEqual(expectedGeoJson);
});

test('Testing .KMZ Parser', async () => {
  const parsedKml = await new KmzFormat().parse(file('./test/fixtures/a.kmz', 'a.kmz'));

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-120.082203542568, 37.4222899014025, 0],
        },
        properties: {
          name: 'Simple placemark two',
          description:
            'Attached to the ground. Intelligently places itself \n       at the height of the underlying terrain.',
          tessellate: '-1',
          extrude: '0',
          visibility: '-1',
        },
      },
    ],
  };

  return expect(parsedKml).toStrictEqual(expectedGeoJson);
});

test('Testing .POLYLINE Parser', async () => {
  const parsedPolyline = await new PolylineFormat().parse(
    file('./test/fixtures/a.polyline', 'a.polyline'),
    {
      precision: 5,
    },
  );

  const expectedGeoJson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-120.2, 38.5],
        [-120.95, 40.7],
        [-126.453, 43.252],
        [-126.453, 43.25194],
      ],
    },
  };

  return expect(parsedPolyline).toStrictEqual(expectedGeoJson);
});

test('Testing .WKT Parser', async () => {
  const parsedWkt = await new WktFormat().parse(file('./test/fixtures/a.wkt', 'a.wkt'));

  const expectedGeoJson = {
    type: 'MultiPoint',
    coordinates: [
      [20, 20],
      [10, 10],
      [30, 30],
    ],
  };

  return expect(parsedWkt).toStrictEqual(expectedGeoJson);
});

test('Testing .GEOJSON Parser', async () => {
  const parsedGeojson = await new GeoJsonFormat().parse(
    file('./test/fixtures/a.geojson', 'a.geojson'),
  );

  return expect(parsedGeojson).toHaveProperty('type', 'FeatureCollection');
});

test('Registry maps extensions to formats', () => {
  const registry = createDefaultRegistry();

  expect(registry.supportedExtensions).toContain('geojson');
  expect(registry.supportedExtensions).toContain('zip');
  expect(registry.get('json')).toBeInstanceOf(GeoJsonFormat);
  expect(registry.get('csv')).toBeInstanceOf(CsvFormat);
  expect(registry.get('zip')).toBeInstanceOf(ShapefileFormat);
  expect(registry.has('unknown')).toBe(false);
});

test('Registry derives the accept extensions', () => {
  const registry = createDefaultRegistry();

  expect(registry.acceptExtensions).toContain('.geojson');
  expect(registry.acceptExtensions).toContain('.shp');
  expect(registry.acceptExtensions).toContain('.prj');
});

test('load fills the target layer with the parsed data', async () => {
  const target = fakeLayer();

  await new GeoJsonFormat().load({
    file: file('./test/fixtures/a.geojson', 'a.geojson'),
    layer: target.layer,
    options,
  });

  expect(target.data()).toHaveProperty('type', 'FeatureCollection');
});

test('load throws a labeled error when the format cannot parse', async () => {
  const target = fakeLayer();

  await expect(
    new UnparseableFormat().load({
      file: file('./test/fixtures/a.geojson', 'unparseable.empty'),
      layer: target.layer,
      options,
    }),
  ).rejects.toThrow('Cannot parse Empty file.');
});

test('load uses the configured csv options', async () => {
  const target = fakeLayer();

  await new CsvFormat().load({
    file: file('./test/fixtures/b.csv', 'b.csv'),
    layer: target.layer,
    options: {
      csvOptions: { delimiter: ';', latfield: 'LATITUDE', lonfield: 'long' },
    } as BetterFileLayerControlOptions,
  });

  expect(target.data()).toHaveProperty('type', 'FeatureCollection');
});

test('load uses the configured polyline precision', async () => {
  const target = fakeLayer();

  await new PolylineFormat().load({
    file: file('./test/fixtures/a.polyline', 'a.polyline'),
    layer: target.layer,
    options: {
      polylineOptions: { precision: 5 },
    } as BetterFileLayerControlOptions,
  });

  expect(target.data()).toMatchObject({ type: 'Feature' });
});

test('ShapefileFormat groups components into a zip and drops the raw parts', async () => {
  const result = await new ShapefileFormat().preprocess([
    file('./test/fixtures/pandr.shp', 'pandr.shp'),
    file('./test/fixtures/pandr.shx', 'pandr.shx'),
    file('./test/fixtures/pandr.dbf', 'pandr.dbf'),
    file('./test/fixtures/pandr.prj', 'pandr.prj'),
    file('./test/fixtures/a.geojson', 'a.geojson'),
  ]);

  const names = result.map((item) => item.name).sort();

  expect(names).toContain('pandr.zip');
  expect(names).toContain('a.geojson');
  expect(names).not.toContain('pandr.shp');
});

test('ShapefileFormat keeps unrelated batches untouched', async () => {
  const input = [file('./test/fixtures/a.geojson', 'a.geojson')];
  const result = await new ShapefileFormat().preprocess(input);

  expect(result).toStrictEqual(input);
});

test('Registry preprocess is a no-op without shapefile components', async () => {
  let result = [file('./test/fixtures/a.geojson', 'a.geojson')];

  for (const format of createDefaultRegistry().registry) {
    result = await format.preprocess(result);
  }

  expect(result.map((item) => item.name)).toStrictEqual(['a.geojson']);
});

test('Testing .SHP Parser (zipped shapefile)', async () => {
  const parsed = (await new ShapefileFormat().parse(
    file('./test/fixtures/pandr.zip', 'pandr.zip'),
  )) as FeatureCollection;

  expect(parsed.type).toBe('FeatureCollection');
  expect(parsed.features).toHaveLength(80);
});

test('Testing .SHP Parser (empty shapefile zip)', async () => {
  const parsed = await new ShapefileFormat().parse(
    file('./test/fixtures/empty-shp.zip', 'empty-shp.zip'),
  );

  expect(parsed).toBeDefined();
});

test('Registry exposes one instance per extension', () => {
  const registry = createDefaultRegistry();

  expect(registry.get('geojson')).toBe(registry.get('json'));
  expect(registry.get('shp')).toBeUndefined();
  expect(registry.supportedExtensions).toHaveLength(10);
});
