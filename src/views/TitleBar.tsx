import * as React from 'react';

export interface TitleBarProps {
  title?: string;
}

export const TitleBar: React.FC<TitleBarProps> = (props) => {
  const { title = 'Satori App for Desktop' } = props;
  return (
    <div className="title-bar">
      <span>{title}</span>
    </div>
  );
}
