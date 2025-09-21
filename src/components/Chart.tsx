import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface ChartProps {
  option: EChartsOption;
  style?: React.CSSProperties;
}

const Chart: React.FC<ChartProps> = ({ option, style }) => {
  return (
    <ReactECharts
      option={option}
      style={style || { height: '350px', width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default Chart;
