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
  icon?: string;
  titleField?: any;
  timeField?: any;
}

export class DataHoverView extends PureComponent<Props> {
  style = getStyles(config.theme2);

  render() {
    const { data, rowIndex, columnIndex, propsToShow, timeField, titleField, icon } = this.props;

    if (!data || rowIndex == null) {
      return null;
    }
    if (propsToShow.length > 1) {
      return (
        <div className={this.style.infoWrap}>
          {titleField.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`}>
              <div className={this.style.singleDisplay}>
                <h5>
                  <i className={'fa ' + icon + ' ' + this.style.icon} />
                  {fmt(f, rowIndex)}
                </h5>
              </div>
            </div>
          ))}
          {propsToShow.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={this.style.row}>
              <span>{getFieldDisplayName(f, data)}:</span>
              <span>{fmt(f, rowIndex)}</span>
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
                <h5>{getFieldDisplayName(f, data)}</h5>
              </div>
              <div className={this.style.singleDisplay}>
                <h1>
                  <i className={'fa ' + icon + ' ' + this.style.icon} />
                  {fmt(f, rowIndex)}
                </h1>
              </div>
            </div>
          ))}
          {timeField.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={this.style.rightDisplay}>
              <h6>{fmt(f, rowIndex)}</h6>
            </div>
          ))}
          {titleField.map((f: Field<any, Vector<any>>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={this.style.rightDisplay}>
              <h6>{fmt(f, rowIndex)}</h6>
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
    padding: 0px;
    div {
      font-weight: ${theme.typography.fontWeightMedium};
      padding: ${theme.spacing(0.25, 2)};
    }
  `,
  row: css`
    padding: 2px;
    display: flex;
    justify-content: space-between;
  `,
  highlight: css`
    background: ${theme.colors.action.hover};
  `,
  singleDisplay: css`
    text-align: center;
    h1 {
      font-size: 3.5rem;
      font-weight: ${theme.typography.fontWeightBold};
      margin: 0px;
    }
  `,
  rightDisplay: css`
    padding-top: 0px;
    padding-bottom: 0px;
    text-align: right;
    h6 {
      font-height: 1;
      margin: 0px;
    }
  `,
  leftDisplay: css`
    text-align: left;
  `,
  icon: css`
    margin-right: 5px;
  `,
}));
