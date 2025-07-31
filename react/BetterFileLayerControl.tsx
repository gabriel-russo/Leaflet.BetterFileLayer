import * as L from 'leaflet';
import 'leaflet-better-filelayer';
import 'leaflet-better-filelayer/leaflet.betterfilelayer.css';
import { BetterFileLayerControlOptions } from 'leaflet-better-filelayer';
import { createControlComponent } from '@react-leaflet/core';

const createBetterFileLayerControl = (props: BetterFileLayerControlOptions) => {
  return new L.Control.BetterFileLayer(props);
};

const BetterFileLayer = createControlComponent(createBetterFileLayerControl);

export default BetterFileLayer;
