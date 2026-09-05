import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

interface StretchableEmphasisBubbleProps {
  width: number;
  height: number;
  minimumWidth: number;
  color: string;
}

const BASE_VIEWBOX_WIDTH = 169.4;
const BASE_VIEWBOX_HEIGHT = 90.3;
const RIGHT_CAP_START_X = 129;

const BUBBLE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [167.2, 48.7],
  [141.9, 41.9],
  [141.9, 23.8],
  [138.4, 23.3],
  [152.6, 2],
  [129, 15.2],
  [129.6, 10.8],
  [23, 10.8],
  [23, 12.4],
  [7.5, 4.9],
  [17.9, 21.2],
  [13.9, 25.9],
  [13.9, 63.6],
  [17.8, 64],
  [2.2, 87.3],
  [22.6, 73.2],
  [23.3, 76.2],
  [129.1, 76.2],
  [131.2, 70.3],
  [143.1, 78.5],
  [139.6, 66.9],
  [141.9, 65.8],
  [141.9, 55.2],
  [152.2, 57.1],
  [147.9, 88.3],
];

/**
 * 말풍선 양쪽 장식은 원래 비율로 유지하고 중앙의 가로 구간만 늘린다.
 */
const StretchableEmphasisBubble: React.FC<StretchableEmphasisBubbleProps> = ({
  width,
  height,
  minimumWidth,
  color,
}) => {
  const safeHeight = Math.max(0, height);
  const safeMinimumWidth = Math.max(0, minimumWidth);
  const safeWidth = Math.max(safeMinimumWidth, width);
  const scale = safeHeight / BASE_VIEWBOX_HEIGHT;
  const baseVectorWidth = BASE_VIEWBOX_WIDTH * scale;
  const sideMargin = Math.max(0, (safeMinimumWidth - baseVectorWidth) / 2);
  const stretchWidth = safeWidth - safeMinimumWidth;
  const stretchViewBoxWidth = scale > 0 ? stretchWidth / scale : 0;
  const vectorWidth = baseVectorWidth + stretchWidth;
  const viewBoxWidth = BASE_VIEWBOX_WIDTH + stretchViewBoxWidth;

  const points = useMemo(
    () =>
      BUBBLE_POINTS.map(([x, y]) => {
        const stretchedX = x >= RIGHT_CAP_START_X ? x + stretchViewBoxWidth : x;
        return `${stretchedX},${y}`;
      }).join(' '),
    [stretchViewBoxWidth]
  );

  return (
    <View style={{ width: safeWidth, height: safeHeight }}>
      <Svg
        width={vectorWidth}
        height={safeHeight}
        viewBox={`0 0 ${viewBoxWidth} ${BASE_VIEWBOX_HEIGHT}`}
        style={{ position: 'absolute', left: sideMargin }}
      >
        <Polygon points={points} fill={color} />
      </Svg>
    </View>
  );
};

export default StretchableEmphasisBubble;
