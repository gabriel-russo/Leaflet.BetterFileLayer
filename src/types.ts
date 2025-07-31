/*
 Event Handlers
*/

import * as L from 'leaflet';
import { Feature } from 'geojson';

export type LayerLoadedEventHandler = (e: {
  layer: L.GeoJSON;
  id: string;
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
  | '.prj';

export interface BetterFileLayerControlOptions extends L.ControlOptions {
  position?: L.ControlPosition;
  fileSizeLimit?: number;
  style?: (feature: Feature) => L.PathOptions;
  onEachFeature?: (feature: Feature, layer: L.Layer) => void;
  layer?: L.GeoJSON;
  extensions?: SupportedExtensions[];
  importOptions?: Record<string, object>;
  text?: {
    title: string;
  };
  will_bind_button_later?: boolean;
  button?: HTMLElement | HTMLInputElement;
}
