import * as L from 'leaflet';
import { Feature } from 'geojson';
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
} from './leaflet.omnivore';
import {
  bytesToKilobytes,
  filterShpComponents,
  getFileBaseName,
  getFileExtension,
  isPropertyNameDisplayable,
  processShapeFiles,
  simpleStyleToLeafletStyle,
} from './utils';
import { BetterFileLayerControlOptions } from './types';

export class BetterFileLayer extends L.Control {
  options: BetterFileLayerControlOptions = {
    position: 'topleft',
    fileSizeLimit: 1024,
    importOptions: {
      csv: {
        delimiter: ',',
        latfield: 'lat',
        lonfield: 'lon',
      },
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
    ],
    text: {
      title: 'Import a layer',
    },
    will_bind_button_later: false,
  };

  private _map: L.Map | undefined;

  constructor(options?: Partial<BetterFileLayerControlOptions>) {
    super(options);
    L.Util.setOptions(this, options || {});
  }

  onAdd(map: L.Map): HTMLDivElement {
    this._map = map;

    // For React, Angular... users that handles conditional render
    if (this.options.will_bind_button_later) {
      return L.DomUtil.create('div');
    }

    if (this.options.button) {
      L.DomEvent.addListener(
        this.options.button,
        'change',
        this._onFileUpload,
        this
      );
      this._enableDragAndDrop();
      return L.DomUtil.create('div');
    }

    const container = L.DomUtil.create('div', 'leaflet-control');
    const inputContainer = L.DomUtil.create(
      'div',
      'leaflet-control-better-filelayer',
      container
    );
    const input = L.DomUtil.create('input', '', inputContainer);

    input.title = this.options.text.title;
    input.type = 'file';
    input.multiple = true;
    input.accept = this.options.extensions.join(',');

    L.DomEvent.addListener(input, 'change', this._onFileUpload, this);

    this._enableDragAndDrop();

    return container;
  }

  bind_button(ref: HTMLInputElement): void {
    L.DomEvent.addListener(ref, 'change', this._onFileUpload, this);
    this._enableDragAndDrop();
  }

  _enableDragAndDrop(): void {
    if (!this._map) {
      return;
    }

    const mapContainer = this._map.getContainer();

    L.DomEvent.addListener(mapContainer, 'dragover', L.DomEvent.stopPropagation)
      .addListener(mapContainer, 'dragover', L.DomEvent.preventDefault)
      .addListener(mapContainer, 'drop', L.DomEvent.stopPropagation)
      .addListener(mapContainer, 'drop', L.DomEvent.preventDefault)
      .addListener(mapContainer, 'drop', this._onDragAndDrop, this);
  }

  _disableDragAndDrop(): void {
    if (!this._map) {
      return;
    }

    const mapContainer = this._map.getContainer();

    L.DomEvent.removeListener(
      mapContainer,
      'dragover',
      L.DomEvent.stopPropagation
    )
      .removeListener(mapContainer, 'dragover', L.DomEvent.preventDefault)
      .removeListener(mapContainer, 'drop', L.DomEvent.stopPropagation)
      .removeListener(mapContainer, 'drop', L.DomEvent.preventDefault)
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

  async _load(files: File[]): Promise<void> {
    if (!files.length) {
      return;
    }

    if (!this._map) {
      return;
    }

    const fileLoaders: Record<string, CallableFunction> = {
      geojson: geojsonLoad,
      json: geojsonLoad,
      kml: kmlLoad,
      kmz: kmzLoad,
      csv: csvLoad,
      wkt: wktLoad,
      gpx: gpxLoad,
      topojson: topojsonLoad,
      polyline: polylineLoad,
      zip: shapefileLoad,
    };

    /* Pre-processing:
      - Search for shapefile components (.shp, .shx, .prj, .dbf) and group by file name
      - If there is any grouped files, zip compress it
      - After that, remove all shapefile components from list
      - And merge the zipped shapefiles to the files list
    */
    const shpZips = await processShapeFiles(files);

    if (shpZips.length) {
      files = [...filterShpComponents(files), ...shpZips];
    }

    for (const file of files) {
      const fileName = getFileBaseName(file);
      const fileExtension = getFileExtension(file);

      const loader = fileLoaders[fileExtension] || null;

      if (!loader) {
        this._map.fire('bfl:filenotsupported', {
          fileName: file.name,
          fileExtension: fileExtension,
          supportedExtensions: this.options.extensions,
        });
        return;
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

      const parserOptions = this.options.importOptions[fileExtension] || {};

      // Creating some metadata to layer.
      const layerOptions = {
        name: fileName,
        id: L.Util.stamp({}).toString(),
        style: (feat: Feature) => {
          // Some softwares that generates KML, use simplestyle-spec as style exporter.
          const featStyle = simpleStyleToLeafletStyle(feat);

          if (!featStyle) {
            return;
          }

          return featStyle as L.PathOptions;
        },
        onEachFeature: (feature: Feature, layer: L.Layer) => {
          if (!feature.properties) {
            return;
          }

          const rows = Object.keys(feature.properties).map((key) => {
            if (isPropertyNameDisplayable(key)) {
              // @ts-ignore
              return `<span><b>${key}</b> : ${feature.properties[key]}</span>`;
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
      };

      if (this.options.style) {
        layerOptions.style = this.options.style;
      }

      if (this.options.onEachFeature) {
        layerOptions.onEachFeature = this.options.onEachFeature;
      }

      const options = { parserOptions, layerOptions };

      try {
        const layer = await loader(file, options, this.options.layer || null);

        if (!layer.getLayers().length) {
          this._map.fire('bfl:layerisempty', {
            fileName: fileName,
            fileExtension: fileExtension,
            fileSize: bytesToKilobytes(file.size),
          });

          continue;
        }

        const addedLayer = layer.addTo(this._map);

        this._map.fire('bfl:layerloaded', {
          layer: addedLayer,
          id: layerOptions.id,
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

export function betterFileLayer(
  options?: Partial<BetterFileLayerControlOptions>
) {
  return new BetterFileLayer(options);
}
