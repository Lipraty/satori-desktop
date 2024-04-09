import * as React from 'react';
import { css } from '../utils';

export interface TitleBarProps {
  title?: string;
}

export const TitleBar: React.FC<TitleBarProps> = (props) => {
  const { title = 'Satori App for Desktop' } = props;
  return (
    <div className=''>
      <style>
        {css`
          @scope {
            :scope {
              -webkit-app-region: drag;
              height: 30px;
              padding: 0 12px;
              display: flex;
              align-items: center;
            }
          }
        `}
      </style>
      <span>{title}</span>
    </div>
  );
}
