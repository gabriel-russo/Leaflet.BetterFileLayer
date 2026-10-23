import { test, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { Map } from 'leaflet';
import { BetterFileLayer } from '@/leaflet.control';
import {
  FileNotSupportedEvent,
  FileSizeLimitEvent,
  LayerIsEmptyEvent,
  LayerLoadedEvent,
  LayerLoadErrorEvent,
} from '@/types.ts';

function file(path: string, name: string): File {
  return new File([readFileSync(path)], name);
}

function textFile(content: string, name: string): File {
  return new File([content], name);
}

let container: HTMLDivElement;
let map: Map;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  map = new Map(container).setView([0, 0], 2);
});

afterEach(() => {
  map.remove();
  container.remove();
});

function setup(options: Record<string, unknown> = {}): BetterFileLayer {
  const bfl = new BetterFileLayer({ addOnMap: false, ...options });
  map.addControl(bfl);
  return bfl;
}

test('fires bfl:layerloaded with the file metadata', async () => {
  const bfl = setup();
  const events: LayerLoadedEvent[] = [];
  map.on('bfl:layerloaded', (event) => events.push(event));

  await bfl._load([file('./test/fixtures/a.geojson', 'a.geojson')]);

  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    fileName: 'a',
    fileExtension: 'geojson',
    fileType: '',
  });
});

test('populates the shared layer with the parsed features', async () => {
  const bfl = setup();

  await bfl._load([file('./test/fixtures/a.geojson', 'a.geojson')]);

  expect(bfl.options.layer.getLayers().length).toBeGreaterThan(0);
});

test('fires bfl:filenotsupported for unknown extensions', async () => {
  const bfl = setup();
  const events: FileNotSupportedEvent[] = [];
  map.on('bfl:filenotsupported', (event) => events.push(event));

  await bfl._load([textFile('hello', 'notes.txt')]);

  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ fileExtension: 'txt' });
  expect(events[0].supportedExtensions).toContain('.geojson');
});

test('fires bfl:filesizelimit when the file is too big', async () => {
  const bfl = setup({ fileSizeLimit: 0 });
  const events: FileSizeLimitEvent[] = [];
  map.on('bfl:filesizelimit', (event) => events.push(event));

  await bfl._load([file('./test/fixtures/a.geojson', 'a.geojson')]);

  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ fileName: 'a', fileExtension: 'geojson' });
});

test('fires bfl:layerisempty when the file has no features', async () => {
  const bfl = setup();
  const events: LayerIsEmptyEvent[] = [];
  map.on('bfl:layerisempty', (event) => events.push(event));

  await bfl._load([textFile('{"type":"FeatureCollection","features":[]}', 'empty.geojson')]);

  expect(events).toHaveLength(1);
});

test('fires bfl:layerloaderror when the parser throws', async () => {
  const bfl = setup();
  const events: LayerLoadErrorEvent[] = [];
  map.on('bfl:layerloaderror', (event) => events.push(event));

  await bfl._load([textFile('{not valid json', 'broken.geojson')]);

  expect(events).toHaveLength(1);
  expect(events[0].fileExtension).toBe('geojson');
  expect(events[0].message).toBeTruthy();
});

test('groups shapefile components into a single layer', async () => {
  const bfl = setup();
  const events: LayerLoadedEvent[] = [];
  map.on('bfl:layerloaded', (event) => events.push(event));

  await bfl._load([
    file('./test/fixtures/pandr.shp', 'pandr.shp'),
    file('./test/fixtures/pandr.shx', 'pandr.shx'),
    file('./test/fixtures/pandr.dbf', 'pandr.dbf'),
    file('./test/fixtures/pandr.prj', 'pandr.prj'),
  ]);

  expect(events).toHaveLength(1);
  expect(bfl.options.layer.getLayers().length).toBeGreaterThan(0);
});

test('loads independent files in the same batch', async () => {
  const bfl = setup();
  const events: LayerLoadedEvent[] = [];
  map.on('bfl:layerloaded', (event) => events.push(event));

  await bfl._load([
    file('./test/fixtures/a.geojson', 'a.geojson'),
    file('./test/fixtures/a.kml', 'a.kml'),
  ]);

  expect(events).toHaveLength(2);
});

test('creates a file input wired with the supported extensions', () => {
  const bfl = setup();

  const input = bfl.getContainer()?.querySelector('input');

  expect(input).toBeInstanceOf(HTMLInputElement);
  expect(input?.type).toBe('file');
  expect(input?.multiple).toBe(true);
  expect(input?.accept).toContain('.geojson');
  expect(input?.accept).toContain('.zip');
});
