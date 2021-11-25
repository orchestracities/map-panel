import React, { PureComponent } from 'react';
import { stylesFactory } from '@grafana/ui';
import { DataFrame, Field, formattedValueToString, getFieldDisplayName, GrafanaTheme2, Vector } from '@grafana/data';
import { css } from '@emotion/css';
import { config } from '../config';

export interface Props {
  data?: DataFrame; // source data
  rowIndex?: number; // the hover row
  columnIndex?: number; // the hover column
  propsToShow?: any;
}

export class DataHoverView extends PureComponent<Props> {
  style = getStyles(config.theme2);

  render() {
    const { data, rowIndex, columnIndex, propsToShow } = this.props;
    if (!data || rowIndex == null) {
      return null;
    }
    if (propsToShow.length > 1) {
      return (
        <table className={this.style.infoWrap}>
          <tbody>
            {propsToShow.map((f: Field<any, Vector<any>>, i: number | undefined) => (
              <tr key={`${i}/${rowIndex}`} className={i === columnIndex ? this.style.highlight : ''}>
                <th>{getFieldDisplayName(f, data)}:</th>
                <td>{fmt(f, rowIndex)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      return propsToShow.map((f: Field<any, Vector<any>>, i: number | undefined) => (
        <div key={`${i}/${rowIndex}`} className={i === columnIndex ? this.style.highlight : ''}>
          <div className={this.style.singleDisplay}>
            {' '}
            <h4>{getFieldDisplayName(f, data)}:</h4>
          </div>

          {fmt(f, rowIndex)}
        </div>
      ));
    }
  }
}

function fmt(field: Field, row: number): string {
  const v = field.values.get(row);
  if (field.display) {
    return formattedValueToString(field.display(v));
  }
  return `${v}`;
}

const getStyles = stylesFactory((theme: GrafanaTheme2) => ({
  infoWrap: css`
    padding: 8px;
    th {
      font-weight: ${theme.typography.fontWeightMedium};
      padding: ${theme.spacing(0.25, 2)};
    }
  `,
  highlight: css`
    background: ${theme.colors.action.hover};
  `,
  singleDisplay: css`
    text-align: center;
  `,
}));
