import * as L from "leaflet";
import "./leaflet.betterfilelayer.css";
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
} from "./leaflet.omnivore";
import {
  bytesToKilobytes,
  extractShpComponents,
  filterShpComponents,
  getFileBaseName,
  getFileExtension,
  filterProperty,
  simpleStyleToLeafletStyle,
  zipShpComponents,
} from "./leaflet.betterfilelayer.utils";

L.Control.BetterFileLayer = L.Control.extend({
  options: {
    position: 'topleft',
    fileSizeLimit: 1024,
    importOptions: {
      csv: {
        delimiter: ';',
        latfield: 'LAT',
        lonfield: 'LONG',
      },
    },
    text: {
      title: "Import a layer",
    },
  },

  initialize(options) {
    options = options || {};
    options.text = L.Util.extend(this.options.text, options.text);
    L.Util.setOptions(this, options);
  },

  onAdd() {
    if (this.options.button) {
      L.DomEvent.addListener(this.options.button, "change", this._load, this);
      this._enableDragAndDrop();
      return L.DomUtil.create("div");
    }

    const container = L.DomUtil.create("div", "leaflet-control");
    const inputContainer = L.DomUtil.create("div", "leaflet-control-better-filelayer", container);
    const input = L.DomUtil.create("input", "", inputContainer);

    input.title = this.options.text.title;
    input.type = "file";
    input.multiple = true;

    if (this.options.formats) {
      input.accept = this.options.formats.join(',');
    } else {
      input.accept = '.gpx,.kml,.kmz,.geojson,.json,.csv,.topojson,.wkt,.shp,.shx,.prj,.dbf,.zip';
    }

    L.DomEvent.addListener(input, "change", this._load, this);

    this._enableDragAndDrop();

    return container;
  },

  _enableDragAndDrop() {
    const mapContainer = this._map.getContainer();

    L.DomEvent.addListener(mapContainer, "dragover", L.DomEvent.stopPropagation)
      .addListener(mapContainer, "dragover", L.DomEvent.preventDefault)
      .addListener(mapContainer, "drop", L.DomEvent.stopPropagation)
      .addListener(mapContainer, "drop", L.DomEvent.preventDefault)
      .addListener(mapContainer, "drop", this._load, this);
  },

  _disableDragAndDrop() {
    const mapContainer = this._map.getContainer();

    L.DomEvent.removeListener(mapContainer, "dragover", L.DomEvent.stopPropagation)
      .removeListener(mapContainer, "dragover", L.DomEvent.preventDefault)
      .removeListener(mapContainer, "drop", L.DomEvent.stopPropagation)
      .removeListener(mapContainer, "drop", L.DomEvent.preventDefault)
      .removeListener(mapContainer, "drop", this._load, this);
  },

  async _load(e) {
    const fileLoaders = {
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

    let files;
    switch (e.type) {
      case "drop":
        files = Array.of(...e.dataTransfer.files);
        break;
      case "change":
        files = Array.of(...e.target.files);
        break;
      default:
        files = [];
        break;
    }

    if (!files.length) {
      return;
    }

    /* Pre-processing:
        - Search for shapefile components (.shp, .shx, .prj, .dbf) and group by file name
        - If there is any grouped files, zip compress it
        - After that, remove all shapefile components from list
        - And merge the zipped shapefiles to the files list
    */
    const shpComponents = extractShpComponents(files);

    if (Object.keys(shpComponents).length) {
      const processedShps = await zipShpComponents(shpComponents);

      const notShpFiles = filterShpComponents(files);

      files = [...notShpFiles, ...processedShps];
    }

    for (const file of files) {
      const loader = fileLoaders[getFileExtension(file.name)] || null;

      if (loader) {
        if (bytesToKilobytes(file.size) > this.options.fileSizeLimit) {
          this._map.fire("bfl:filesizelimit", { layer: file.name }, this);
          continue;
        }

        const parserOptions = this.options.importOptions[getFileExtension(file.name)] || {};

        const layerOptions = {
          name: getFileBaseName(file.name),
          id: L.Util.stamp({}).toString(),
          zIndex: 999,
          style: (feat) => {
            // simplestyle-spec to leaflet path style
            const featStyle = simpleStyleToLeafletStyle(feat);
            if (Object.keys(featStyle).length) {
              return featStyle;
            }
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              const rows = Object.keys(feature.properties)
                .map((key) => {
                  const isPropBanned = filterProperty(key);

                  if (!isPropBanned) {
                    return `<span> <b>${key}</b> : ${feature.properties[key]} </span>`;
                  }

                  return null;
                });

              layer.bindPopup(
                `
                  <div style="display:flex;flex-direction:column;gap:5px"> 
                      ${rows.join("")}
                  </div>
                `,
                {
                  maxHeight: 240,
                },
              );
            }
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
          const layer = await loader(URL.createObjectURL(file), options, this.options.layer || null);

          if (!layer.getLayers().length) {
            this._map.fire("bfl:layerisempty", { layer: file.name }, this);
            continue;
          }

          const addedLayer = layer.addTo(this._map);

          if (layer instanceof L.FeatureGroup) {
            const bounds = layer.getBounds();

            if (bounds.isValid()) {
              const southWest = bounds.getSouthWest();
              const northEast = bounds.getNorthEast();
              const hasOnlyOnePoint = southWest.equals(northEast);

              if (hasOnlyOnePoint) {
                this._map.setView(southWest, 14);
              } else {
                this._map.fitBounds(bounds);
              }
            }
          }

          this._map.fire("bfl:layerloaded", { layer: addedLayer }, this);
        } catch (err) {
          this._map.fire("bfl:layerloaderror", { layer: file.name }, this);
        }
      } else {
        this._map.fire("bfl:filenotsupported", { layer: file.name });
      }
    }
  },

  onRemove() {
    this._disableDragAndDrop();
  },
});

L.Map.mergeOptions({
  betterFileLayerControl: false,
});

L.Map.addInitHook(function () {
  if (this.options.betterFileLayerControl) {
    L.Control.betterFileLayer()
      .addTo(this);
  }
});

L.Control.betterFileLayer = (options) => new L.Control.BetterFileLayer(options);
