// @ts-ignore
import './styles.css';
import { Map, Util, DomUtil, DomEvent, Control, GeoJSON } from 'leaflet';
import type { Layer } from 'leaflet';
import type { Feature } from 'geojson';
import {
  csvLoad,
  geojsonLoad,
  gpxLoad,
  kmlLoad,
  kmzLoad,
  polylineLoad,
  shapefileLoad,
  topojsonLoad,
  wktLoad,
} from './leaflet.omnivore.ts';
import {
  bytesToKilobytes,
  removeShpComponents,
  getFileBaseName,
  getFileExtension,
  isPropertyNameDisplayable,
  processShapeFiles,
  simpleStyleToLeafletStyle,
} from './utils.ts';
import type {
  FileNotSupportedEventHandler,
  FileSizeLimitEventHandler,
  LayerIsEmptyEventHandler,
  LayerLoadedEventHandler,
  LayerLoadErrorEventHandler,
  BetterFileLayerControlOptions,
} from './types.ts';

declare module 'leaflet' {
  interface Events {
    on(type: 'bfl:layerloaded', fn: LayerLoadedEventHandler): this;

    on(type: 'bfl:layerloaderror', fn: LayerLoadErrorEventHandler): this;

    on(type: 'bfl:filenotsupported', fn: FileNotSupportedEventHandler): this;

    on(type: 'bfl:layerisempty', fn: LayerIsEmptyEventHandler): this;

    on(type: 'bfl:filesizelimit', fn: FileSizeLimitEventHandler): this;
  }
}

export class BetterFileLayer extends Control {
  declare options: Partial<BetterFileLayerControlOptions>;
  defaultOpts: Readonly<BetterFileLayerControlOptions> = {
    position: 'topleft',
    fileSizeLimit: 10240,
    layer: new GeoJSON(),
    csvOptions: {
      delimiter: ',',
      latfield: 'lat',
      lonfield: 'lon',
    },
    polylineOptions: {
      precision: 6,
    },
    style: simpleStyleToLeafletStyle,
    onEachFeature: (feature: Feature, layer: Layer) => {
      if (!feature.properties) {
        return;
      }

      const rows = Object.keys(feature.properties).map((key) => {
        if (isPropertyNameDisplayable(key)) {
          return `<span><b>${key}</b> : ${feature?.properties?.[key] || ''}</span>`;
        }
      });

      layer.bindPopup(
        `
            <div style="display:flex;flex-direction:column;gap:5px"> 
                ${rows.join('')}
            </div>
            `,
        {
          maxHeight: 240,
        }
      );
    },
    extensions: [
      '.geojson',
      '.json',
      '.kml',
      '.kmz',
      '.csv',
      '.wkt',
      '.gpx',
      '.topojson',
      '.polyline',
      '.zip',
      '.shp',
      '.shx',
      '.dbf',
      '.prj',
      '.cpg',
    ],
    text: {
      title: 'Import a layer',
    },
    addOnMap: true,
  };

  private _map: Map;

  constructor(options?: Partial<BetterFileLayerControlOptions>) {
    super(options);
    Util.setOptions(this, options || this.defaultOpts);
  }

  onAdd(map: Map): HTMLDivElement {
    this._map = map;

    /*
      Binding external button: Enable event listeners
      and return empty div because of Leaflet Control
      instance rules.
     */
    if (this.options.button) {
      DomEvent.on(this.options.button, 'change', this._onFileUpload, this);
      this._enableDragAndDrop();
      return DomUtil.create('div');
    }

    /*
     * Better File Layer default control creation.
     */
    const container = DomUtil.create(
      'div',
      'leaflet-control leaflet-control-better-filelayer'
    );

    const input = DomUtil.create('input', '', container);
    input.title = this.options?.text?.title || this.defaultOpts.text.title;
    input.type = 'file';
    input.multiple = true;
    input.accept =
      this.options?.extensions?.join(',') ||
      this.defaultOpts.extensions.join(',');

    DomEvent.on(input, 'change', this._onFileUpload, this);

    this._enableDragAndDrop();

    return container;
  }

  _enableDragAndDrop(): void {
    if (!this._map) {
      return;
    }

    const mapContainer = this._map.getContainer();

    DomEvent.on(mapContainer, 'dragover', DomEvent.stop)
      .on(mapContainer, 'drop', DomEvent.stop)
      .on(mapContainer, 'drop', this._onDragAndDrop, this);
  }

  _disableDragAndDrop(): void {
    if (!this._map) {
      return;
    }

    const mapContainer = this._map.getContainer();

    DomEvent.removeListener(mapContainer, 'dragover', DomEvent.stop)
      .removeListener(mapContainer, 'drop', DomEvent.stop)
      .removeListener(mapContainer, 'drop', this._onDragAndDrop, this);
  }

  _onDragAndDrop(e: Event): void {
    const target = e as DragEvent;

    if (!target.dataTransfer) {
      return;
    }

    const files: File[] = Array.of(...target.dataTransfer.files);

    this._load(files);
  }

  _onFileUpload(e: Event): void {
    const target = e.target as HTMLInputElement;

    if (!target.files) {
      return;
    }

    const files: File[] = Array.of(...target.files);

    this._load(files);
  }

  _isFileTypeSupported(extension: string): boolean {
    return [
      'geojson',
      'json',
      'kml',
      'wkt',
      'gpx',
      'topojson',
      'csv',
      'polyline',
      'zip',
      'kmz',
    ].includes(extension);
  }

  async _load(files: File[]): Promise<void> {
    if (!files.length) {
      return;
    }

    if (!this._map) {
      return;
    }

    /* Pre-processing:
      - Search for shapefile components (.shp, .shx, .prj, .dbf) and group by file name
      - If there is any grouped files, zip compress it
      - After that, remove all shapefile components from list
      - And merge the zipped shapefiles to the files list
    */
    const shpZips = await processShapeFiles(files);

    if (shpZips.length) {
      files = [...removeShpComponents(files), ...shpZips];
    }

    for (const file of files) {
      const fileName = getFileBaseName(file);
      const fileExtension = getFileExtension(file);

      if (!this._isFileTypeSupported(fileExtension)) {
        this._map.fire('bfl:filenotsupported', {
          fileName: file.name,
          fileExtension: fileExtension,
          supportedExtensions: this.options.extensions,
        });
        return;
      }

      if (!this.options.fileSizeLimit) {
        this.options.fileSizeLimit = this.defaultOpts.fileSizeLimit;
      }

      if (bytesToKilobytes(file.size) > this.options.fileSizeLimit) {
        this._map.fire('bfl:filesizelimit', {
          fileName: fileName,
          fileExtension: fileExtension,
          fileSize: bytesToKilobytes(file.size),
          maxFileSize: this.options.fileSizeLimit,
        });
        continue;
      }

      if (!this.options.style) {
        this.options.style = this.defaultOpts.style;
      }

      if (!this.options.onEachFeature) {
        this.options.onEachFeature = this.defaultOpts.onEachFeature;
      }

      if (!this.options.layer) {
        this.options.layer = this.defaultOpts.layer;
      }

      this.options.layer.setStyle(this.options.style);
      this.options.layer.options.onEachFeature = this.options.onEachFeature;

      if (!this.options.csvOptions) {
        this.options.csvOptions = this.defaultOpts.csvOptions;
      }

      if (!this.options.polylineOptions) {
        this.options.polylineOptions = this.defaultOpts.polylineOptions;
      }

      try {
        if (fileExtension === 'csv') {
          this.options.layer = await csvLoad({
            file: file,
            options: this.options.csvOptions,
            layer: this.options.layer,
          });
        }
        if (fileExtension === 'polyline') {
          this.options.layer = await polylineLoad({
            file: file,
            options: this.options.polylineOptions,
            layer: this.options.layer,
          });
        }
        if (['geojson', 'json'].includes(fileExtension)) {
          this.options.layer = await geojsonLoad({
            file: file,
            layer: this.options.layer,
          });
        }
        if (fileExtension === 'kml') {
          this.options.layer = await kmlLoad({
            file: file,
            layer: this.options.layer,
          });
        }
        if (fileExtension === 'kmz') {
          this.options.layer = await kmzLoad({
            file: file,
            layer: this.options.layer,
          });
        }
        if (fileExtension === 'wkt') {
          this.options.layer = await wktLoad({
            file: file,
            layer: this.options.layer,
          });
        }
        if (fileExtension === 'gpx') {
          this.options.layer = await gpxLoad({
            file: file,
            layer: this.options.layer,
          });
        }
        if (fileExtension === 'topojson') {
          this.options.layer = await topojsonLoad({
            file: file,
            layer: this.options.layer,
          });
        }
        if (fileExtension === 'zip') {
          this.options.layer = await shapefileLoad({
            file: file,
            layer: this.options.layer,
          });
        }

        if (!this.options.layer.getLayers().length) {
          this._map.fire('bfl:layerisempty', {
            fileName: fileName,
            fileExtension: fileExtension,
            fileSize: bytesToKilobytes(file.size),
          });
          continue;
        }

        if (!this.options.addOnMap) {
          this.options.addOnMap = this.defaultOpts.addOnMap;
        }

        if (this.options.addOnMap) {
          this.options.layer.addTo(this._map);
        }

        this._map.fire('bfl:layerloaded', {
          layer: this.options.layer,
          fileName: fileName,
          fileExtension: fileExtension,
          fileSize: bytesToKilobytes(file.size),
          fileType: file.type,
          fileLastModified: new Date(file.lastModified),
          fileUploadDate: new Date(),
        });
      } catch (err) {
        this._map.fire('bfl:layerloaderror', {
          fileName: fileName,
          fileExtension: fileExtension,
          exception: err,
          message: (err as Error).message,
        });
      }
    }
  }

  onRemove() {
    this._disableDragAndDrop();
  }
}

// Object.assign(Control, {
//   BetterFileLayer: BetterFileLayer,
// });
//
// Map.mergeOptions({
//   betterFileLayerControl: false,
// });
