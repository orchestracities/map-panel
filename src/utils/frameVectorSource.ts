import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import VectorSource from 'ol/source/Vector';

import { DataFrame } from '@grafana/data';

import { dataFrameToPoints, LocationFieldMatchers } from './location';

export interface FrameVectorSourceOptions {}

export class FrameVectorSource<T extends Geometry = Geometry> extends VectorSource<T> {
  constructor(private location: LocationFieldMatchers) {
    super({});
  }

  update(frame: DataFrame) {
    this.clear(true);
    const info = dataFrameToPoints(frame, this.location);
    if (!info.points) {
      this.changed();
      return;
    }

    for (let i = 0; i < frame.length; i++) {
      this.addFeatureInternal(
        new Feature({
          frame,
          rowIndex: i,
          geometry: info.points[i] as T,
        })
      );
    }

    // only call this at the end
    this.changed();
  }
}
