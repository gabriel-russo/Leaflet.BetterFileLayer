import './styles.css';
import type { Layer, Map } from 'leaflet';
import { Control, DomEvent, DomUtil, GeoJSON, Util } from 'leaflet';
import type { Feature } from 'geojson';
import { createDefaultRegistry, type FileFormatRegistry } from './formats';
import {
  buildPopupContent,
  bytesToKilobytes,
  getFileBaseName,
  getFileExtension,
  simpleStyleToLeafletStyle,
} from './utils';
import { BFL_EVENTS, type BetterFileLayerControlOptions, type BflEventPayloads } from './types';

export type { BetterFileLayerControlOptions } from './types';

export class BetterFileLayer extends Control {
  declare options: BetterFileLayerControlOptions;

  private _map: Map;
  private readonly _formats: FileFormatRegistry;

  private static defaults(extensions: string[]): BetterFileLayerControlOptions {
    return {
      position: 'topleft',
      fileSizeLimit: 10240,
      layer: new GeoJSON(),
      csvOptions: { delimiter: ',', latfield: 'lat', lonfield: 'lon' },
      polylineOptions: { precision: 6 },
      style: simpleStyleToLeafletStyle,
      onEachFeature: (feature: Feature, layer: Layer) => {
        const html = buildPopupContent(feature);
        if (html) layer.bindPopup(html, { maxHeight: 240 });
      },
      extensions,
      text: { title: 'Import a layer' },
      addOnMap: true,
    };
  }

  constructor(options?: Partial<BetterFileLayerControlOptions>) {
    super(options);
    this._formats = createDefaultRegistry();
    Util.setOptions(this, {
      ...BetterFileLayer.defaults(this._formats.acceptExtensions),
      ...options,
    });
  }

  onAdd(map: Map): HTMLDivElement {
    this._map = map;

    /*
      Binding external button: Enable event listeners and return empty div because of Leaflet Control instance rules.
     */
    if (this.options.button) {
      DomEvent.on(this.options.button, 'change', this._onFileUpload, this);
      this._enableDragAndDrop();
      return DomUtil.create('div');
    }

    /*
     * Better File Layer default control creation.
     */
    const container = DomUtil.create('div', 'leaflet-control leaflet-control-better-filelayer');
    const input = DomUtil.create('input', '', container);
    input.title = this.options.text.title;
    input.type = 'file';
    input.multiple = true;
    input.accept = this.options.extensions.join(',');
    DomEvent.on(input, 'change', this._onFileUpload, this);
    this._enableDragAndDrop();

    return container;
  }

  onRemove() {
    this._disableDragAndDrop();
  }

  _enableDragAndDrop(): void {
    const container = this._map.getContainer();
    DomEvent.on(container, 'dragover', DomEvent.stop)
      .on(container, 'drop', DomEvent.stop)
      .on(container, 'drop', this._onDragAndDrop, this);
  }

  _disableDragAndDrop(): void {
    const container = this._map.getContainer();
    DomEvent.off(container, 'dragover', DomEvent.stop)
      .off(container, 'drop', DomEvent.stop)
      .off(container, 'drop', this._onDragAndDrop, this);
  }

  _onDragAndDrop(e: Event): void {
    const event = e as DragEvent;
    if (!event.dataTransfer) return;
    void this._load(Array.from(event.dataTransfer.files));
  }

  _onFileUpload(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    void this._load(Array.from(input.files));
  }

  private _prepareLayer(): void {
    /* setting the default behaviors of layer */
    this.options.layer.options.style = this.options.style;
    this.options.layer.options.onEachFeature = this.options.onEachFeature;
  }

  private _fire<K extends keyof BflEventPayloads>(event: K, payload: BflEventPayloads[K]): void {
    this._map.fire(event, payload);
  }

  async _load(files: File[]): Promise<void> {
    if (!files.length) return;

    let processed = files;

    /* For every format, they can preprocess the file list based on their needs.
     * Ex.: Shapefile removes the components (.shp, .dbf, ...) and compress them with Zip.
     * */
    for (const format of this._formats.registry) {
      /* Process file list inplace */
      processed = await format.preprocess(processed);
    }

    for (const file of processed) {
      const fileName = getFileBaseName(file);
      const extension = getFileExtension(file);
      const format = this._formats.get(extension);

      if (!format) {
        this._fire(BFL_EVENTS.fileNotSupported, {
          fileName: file.name,
          fileExtension: extension,
          supportedExtensions: this.options.extensions,
        });
        continue;
      }

      if (bytesToKilobytes(file.size) > this.options.fileSizeLimit) {
        this._fire(BFL_EVENTS.fileSizeLimit, {
          fileName,
          fileExtension: extension,
          fileSize: bytesToKilobytes(file.size),
          maxFileSize: this.options.fileSizeLimit,
        });
        continue;
      }

      this._prepareLayer();

      try {
        /* Parse and then load the data inside Leaflet GeoJSON Layer (this.options.layer) */
        await format.load({
          file,
          layer: this.options.layer,
          options: this.options,
        });

        const layer = this.options.layer;

        if (!layer.getLayers().length) {
          this._fire(BFL_EVENTS.layerIsEmpty, {
            fileName,
            fileExtension: extension,
            fileSize: bytesToKilobytes(file.size),
          });
          continue;
        }

        if (this.options.addOnMap) {
          layer.addTo(this._map);
          this._map.fitBounds(layer.getBounds());
        }

        this._fire(BFL_EVENTS.layerLoaded, {
          layer,
          fileName,
          fileExtension: extension,
          fileSize: bytesToKilobytes(file.size),
          fileType: file.type,
          fileLastModified: new Date(file.lastModified),
          fileUploadDate: new Date(),
        });
      } catch (exception) {
        this._fire(BFL_EVENTS.layerLoadError, {
          fileName,
          fileExtension: extension,
          exception: exception as Error,
          message: (exception as Error).message,
        });
      }
    }
  }
}
