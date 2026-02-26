/*
 Event Handlers
*/

import type {
  ControlOptions,
  ControlPosition,
  GeoJSON,
  Layer,
  PathOptions,
} from 'leaflet';
import type { Feature } from 'geojson';

export type LayerLoadedEventHandler = (e: {
  layer: GeoJSON;
  fileName: string;
  fileExtension: string;
  fileSize: number;
  fileType: string;
  fileLastModified: Date;
  fileUploadDate: Date;
}) => void;

export type LayerLoadErrorEventHandler = (e: {
  fileName: string;
  fileExtension: string;
  exception: Error;
  message: string;
}) => void;

export type FileNotSupportedEventHandler = (e: {
  fileName: string;
  fileExtension: string;
  supportedExtensions: string[];
}) => void;

export type LayerIsEmptyEventHandler = (e: {
  fileName: string;
  fileExtension: string;
  fileSize: number;
}) => void;

export type FileSizeLimitEventHandler = (e: {
  fileName: string;
  fileExtension: string;
  fileSize: number;
  maxFileSize: number;
}) => void;

/*
  CONTROL
*/

export type SupportedExtensions =
  | '.geojson'
  | '.json'
  | '.kml'
  | '.kmz'
  | '.csv'
  | '.wkt'
  | '.gpx'
  | '.topojson'
  | '.polyline'
  | '.zip'
  | '.shp'
  | '.shx'
  | '.dbf'
  | '.prj'
  | '.cpg';

export interface BetterFileLayerControlOptions extends ControlOptions {
  position: ControlPosition;
  fileSizeLimit: number;
  style: (feature: Feature) => PathOptions;
  onEachFeature: (feature: Feature, layer: Layer) => void;
  layer: GeoJSON;
  extensions: SupportedExtensions[];
  csvOptions: {
    delimiter: string;
    latfield: string;
    lonfield: string;
  };
  polylineOptions: {
    precision: number;
  };
  text: {
    title: string;
  };
  button?: HTMLElement | HTMLInputElement;
  addOnMap: boolean;
}
