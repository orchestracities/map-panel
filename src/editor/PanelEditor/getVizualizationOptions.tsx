import React from 'react';
import { PanelOptionsEditorItem, StandardEditorContext } from '@grafana/data';
import { get as lodashGet } from 'lodash';
import { OptionsPaneItemDescriptor } from './OptionsPaneItemDescriptor';
import { OptionsPaneCategoryDescriptor } from './OptionsPaneCategoryDescriptor';

type categoryGetter = (categoryNames?: string[]) => OptionsPaneCategoryDescriptor;
/**
 * This will iterate all options panes and add register them with the configured categories
 *
 * @internal
 */
export function fillOptionsPaneItems(
  optionEditors: PanelOptionsEditorItem[],
  getOptionsPaneCategory: categoryGetter,
  onValueChanged: (path: string, value: any) => void,
  context: StandardEditorContext<any>
) {
  for (const pluginOption of optionEditors) {
    if (pluginOption.showIf && !pluginOption.showIf(context.options, context.data)) {
      continue;
    }

    const category = getOptionsPaneCategory(pluginOption.category);
    const Editor = pluginOption.editor;

    // TODO? can some options recursivly call: fillOptionsPaneItems?

    category.addItem(
      new OptionsPaneItemDescriptor({
        title: pluginOption.name,
        description: pluginOption.description,
        render: function renderEditor() {
          return (
            <Editor
              value={lodashGet(context.options, pluginOption.path)}
              onChange={(value: any) => {
                onValueChanged(pluginOption.path, value);
              }}
              item={pluginOption}
              context={context}
            />
          );
        },
      })
    );
  }
}
