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
  titleField?: any;
  timeField?: any;
}

export class DataHoverView extends PureComponent<Props> {
  style = getStyles(config.theme2);

  render() {
    const { data, rowIndex, columnIndex, propsToShow, timeField, titleField } = this.props;
    if (!data || rowIndex == null) {
      return null;
    }
    if (propsToShow.length > 1) {
      return (
        <div className={this.style.infoWrap}>
          {titleField.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`}>
              <div className={this.style.singleDisplay}>
                <h3>{fmt(f, rowIndex)}</h3>
              </div>
            </div>
          ))}
          {propsToShow.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={i === columnIndex ? this.style.highlight : ''}>
              <p>
                <span>{getFieldDisplayName(f, data)}:</span> <span>{fmt(f, rowIndex)}</span>
              </p>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className={this.style.infoWrap}>
          {propsToShow.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={i === columnIndex ? this.style.highlight : ''}>
              <div className={this.style.singleDisplay}>
                {' '}
                <h3>{getFieldDisplayName(f, data)}</h3>
              </div>
              <div className={this.style.singleDisplay}>
                <h2>{fmt(f, rowIndex)}</h2>
              </div>
            </div>
          ))}
          {timeField.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`}>
              <div className={this.style.rightDisplay}>
                <h6>{fmt(f, rowIndex)}</h6>
              </div>
            </div>
          ))}
          {titleField.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`}>
              <div className={this.style.rightDisplay}>
                <h6>{fmt(f, rowIndex)}</h6>
              </div>
            </div>
          ))}
        </div>
      );
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
    div {
      font-weight: ${theme.typography.fontWeightMedium};
      padding: ${theme.spacing(0.25, 2)};
    }
    p {
      display: flex;
      justify-content: space-between;
    }
  `,
  highlight: css`
    background: ${theme.colors.action.hover};
  `,
  singleDisplay: css`
    text-align: center;
  `,
  rightDisplay: css`
    text-align: right;
  `,
  leftDisplay: css`
    text-align: left;
  `,
}));
