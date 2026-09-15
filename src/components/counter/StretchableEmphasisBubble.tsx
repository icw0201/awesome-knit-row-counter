import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

// 말풍선의 최종 크기, 기본 너비, 색상을 외부에서 전달받는다.
interface StretchableEmphasisBubbleProps {
  width: number;
  height: number;
  minimumWidth: number;
  color: string;
}

// 기존 SVG의 원본 viewBox 크기를 좌표 계산 기준으로 사용한다.
const BASE_VIEWBOX_WIDTH = 169.4;
const BASE_VIEWBOX_HEIGHT = 90.3;
// 이 x좌표부터 오른쪽 장식으로 보고 가로 확장 거리만큼 함께 이동시킨다.
const RIGHT_CAP_START_X = 129;

// 기존 emphasis_bubble.svg의 외곽선 꼭짓점 좌표를 순서대로 보존한다.
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
  // 잘못된 음수 크기가 네이티브 뷰에 전달되지 않도록 렌더링 크기를 보정한다.
  const safeHeight = Math.max(0, height);
  const safeMinimumWidth = Math.max(0, minimumWidth);
  const safeWidth = Math.max(safeMinimumWidth, width);
  // 원본 SVG 좌표를 현재 말풍선 높이의 화면 좌표로 변환할 배율을 구한다.
  const scale = safeHeight / BASE_VIEWBOX_HEIGHT;
  const baseVectorWidth = BASE_VIEWBOX_WIDTH * scale;
  // 최소 너비일 때 기존 SVG가 가운데 정렬되도록 좌우 여백을 유지한다.
  const sideMargin = Math.max(0, (safeMinimumWidth - baseVectorWidth) / 2);
  // 요청 너비 중 기본 너비를 초과한 부분만 중앙 가로 구간의 확장량으로 사용한다.
  const stretchWidth = safeWidth - safeMinimumWidth;
  // 화면 단위 확장량을 원본 viewBox 좌표 단위로 되돌린다.
  const stretchViewBoxWidth = scale > 0 ? stretchWidth / scale : 0;
  // 늘어난 중앙 구간을 포함한 실제 SVG 너비와 viewBox 너비를 계산한다.
  const vectorWidth = baseVectorWidth + stretchWidth;
  const viewBoxWidth = BASE_VIEWBOX_WIDTH + stretchViewBoxWidth;

  // 왼쪽 형태는 고정하고 오른쪽 장식 좌표만 이동해 중앙 직선 구간을 늘린다.
  const points = useMemo(
    () =>
      BUBBLE_POINTS.map(([x, y]) => {
        const stretchedX = x >= RIGHT_CAP_START_X ? x + stretchViewBoxWidth : x;
        return `${stretchedX},${y}`;
      }).join(' '),
    [stretchViewBoxWidth]
  );

  // 외부 컨테이너는 요청된 전체 말풍선 영역을 차지한다.
  return (
    <View style={{ width: safeWidth, height: safeHeight }}>
      <Svg
        width={vectorWidth}
        height={safeHeight}
        viewBox={`0 0 ${viewBoxWidth} ${BASE_VIEWBOX_HEIGHT}`}
        style={{ position: 'absolute', left: sideMargin }}
      >
        {/* 계산된 꼭짓점을 연결하고 규칙에 지정된 색상으로 말풍선을 채운다. */}
        <Polygon points={points} fill={color} />
      </Svg>
    </View>
  );
};

export default StretchableEmphasisBubble;
