import React from 'react';
import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Select } from '@grafana/ui';

export const QuerySelector: React.FC<StandardEditorProps<string>> = ({ item, value, onChange, context }) => {
  const options: Array<SelectableValue<string>> = [];

  if (context.data) {
    const frames = context.data;

    for (let i = 0; i < frames.length; i++) {
      options.push({
        label: frames[i].refId,
        value: frames[i].refId,
      });
    }
  }

  return <Select options={options} value={value} onChange={(selectableValue) => onChange(selectableValue.value)} />;
};
