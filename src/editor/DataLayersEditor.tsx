import React from 'react';
import { PluginState, StandardEditorProps } from '@grafana/data';
import { CollapsableSection, ToolbarButton } from '@grafana/ui';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from 'extension';
import { GeomapPanelOptions } from 'types';
import { defaultMarkersConfig } from '../layers/data/markersLayer';
import { hasAlphaPanels } from 'config';
import { LayerEditor } from './LayerEditor';
import _ from 'lodash';

function dataLayerFilter(layer: ExtendMapLayerRegistryItem): boolean {
  if (layer.isBaseMap) {
    return false;
  }
  if (layer.state === PluginState.alpha) {
    return hasAlphaPanels;
  }
  return true;
}

export const DataLayersEditor: React.FC<StandardEditorProps<ExtendMapLayerOptions[], any, GeomapPanelOptions>> = ({
  value,
  onChange,
  context,
}) => {
  const onAddLayer = () => {
    let newData: ExtendMapLayerOptions[] = value ? _.cloneDeep(value) : [];
    newData.push(defaultMarkersConfig);
    onChange(newData);
  };
  const onDeleteLayer = (index: number) => {
    let newData: ExtendMapLayerOptions[] = value ? _.cloneDeep(value) : [];
    newData.splice(index, 1);
    onChange(newData);
  };
  return (
    <>
      <div className="data-layer-add">
        <ToolbarButton icon="plus" tooltip="add new layer" variant="primary" key="Add" onClick={onAddLayer}>
          Add Layer
        </ToolbarButton>
      </div>
      {(value || []).map((v, index) => {
        return (
          <>
            <CollapsableSection label={v.name ? v.name + ' layer' : 'unnamed layer'} isOpen={false}>
              <LayerEditor
                options={v ? v : undefined}
                data={context.data}
                onChange={(cfg) => {
                  let newData: ExtendMapLayerOptions[] = value ? _.cloneDeep(value) : [];
                  newData[index] = cfg;
                  console.log('Change overlays:', newData);
                  onChange(newData);
                }}
                filter={dataLayerFilter}
              />
              <div className="data-layer-remove">
                <ToolbarButton
                  icon="trash-alt"
                  tooltip="delete"
                  variant="destructive"
                  key="Delete"
                  onClick={(e) => {
                    onDeleteLayer(index);
                  }}
                >
                  Delete
                </ToolbarButton>
              </div>
            </CollapsableSection>
          </>
        );
      })}
    </>
  );
};
