import React, { useState, useRef, useEffect } from 'react';
import { View, Dimensions, DimensionValue } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ModalHandle } from './ModalHandle';

// ===== 타입 정의 =====
interface SlideModalProps {
  children: React.ReactNode;
  isOpen?: boolean; // 모달 열림 상태 (기본값: false)
  onToggle?: () => void; // 토글 콜백 (선택사항)
  height?: number; // 모달의 세로 길이 (기본값: 300)
  width?: number; // 모달의 가로 길이 (기본값: screenWidth)
  handleWidth?: number; // 핸들의 가로 길이 (기본값: 40)
  backgroundColor?: string; // 배경색 (기본값: white)
  padding?: number; // 모달 내부 패딩 (기본값: 20)
  centerY?: DimensionValue; // 모달 세로 중앙 위치 (기본값: '50%'). SlideModal이 translateY: -height/2 로 보정함.
  onClose?: () => void; // 닫기 콜백 (선택사항)
  /** 닫힌 상태(핸들만 노출)일 때 패널 오른쪽 기준 위치에 고정. 드래그/열림 translateX에는 따르지 않음 */
  sideTooltip?: React.ReactNode;
}


// ===== 상수 =====
const { width: screenWidth } = Dimensions.get('window');

// ===== 메인 컴포넌트 =====
export const SlideModal: React.FC<SlideModalProps> = ({
  children,
  isOpen = false,
  onToggle,
  height = 300,
  width = screenWidth,
  handleWidth = 40,
  backgroundColor = 'white',
  padding = 20,
  centerY = '50%',
  onClose,
  sideTooltip,
}) => {
  // ===== 상태 관리 =====
  // 왼쪽 모달 기준:
  // - 닫힌 상태: translateX = handleWidth (핸들만 보임)
  // - 열린 상태: translateX = width (완전히 열림)
  const [translateX, setTranslateX] = useState(isOpen ? width : handleWidth);

  const modalRef = useRef<View>(null);

  // isOpen props가 변경될 때 translateX 업데이트
  useEffect(() => {
    setTranslateX(isOpen ? width : handleWidth);
  }, [isOpen, width, handleWidth]);

  // ===== 핸들러 함수들 =====

  // 모달 열기
  const handleOpen = () => {
    setTranslateX(width);
    onToggle?.();
  };

  // 모달 닫기
  const handleClose = () => {
    setTranslateX(handleWidth);
    onToggle?.();
    onClose?.();
  };

  // 드래그 위치 업데이트
  const handleDragUpdate = (newTranslateX: number) => {
    setTranslateX(newTranslateX);
  };


  // ===== 렌더링 =====
  return (
    <View
      className="absolute top-0 left-0 right-0 bottom-0"
      style={{ zIndex: 50 }}
      pointerEvents="box-none"
    >
      {/* 모달 내용 - 항상 보임, 드래그에 따라 위치 변경 */}
      <View
        ref={modalRef}
        className="absolute border-t-2 border-r-2 border-white"
        style={{
          top: centerY,
          left: -width,
          width: width,
          height: height,
          backgroundColor,
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          // iOS용 그림자 (위쪽 그림자 제거)
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          // Android용 그림자
          elevation: 3,
          transform: [
            { translateX: translateX },
            { translateY: -height / 2 },
          ],
        }}
      >
        <LinearGradient
          colors={['#ffc7c6', '#ffe1e0', '#ffffff']} // red-orange-200, red-orange-100, white
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.2, 0.6]} // 그라데이션 비율
          className="flex-1"
          style={{
            // 핸들이 모달의 오른쪽(handleWidth) 영역을 덮기 때문에,
            // children이 겹치지 않도록 해당 영역만큼 여유를 추가로 확보
            paddingTop: padding,
            paddingBottom: padding,
            paddingLeft: padding,
            paddingRight: padding + (handleWidth * 0.4),
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          {children}
        </LinearGradient>
      </View>

      {/* 핸들 - 터치/드래그 로직은 ModalHandle에서 처리 */}
      <ModalHandle
        isOpen={isOpen}
        height={height}
        handleWidth={handleWidth}
        modalWidth={width}
        translateX={translateX}
        centerY={centerY}
        onOpen={handleOpen}
        onClose={handleClose}
        onToggle={onToggle}
        onDragUpdate={handleDragUpdate}
      />

      {sideTooltip != null ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: centerY,
            left: 0,
            zIndex: 51,
            height,
            justifyContent: 'center',
            paddingLeft: 8,
            transform: [
              { translateX: handleWidth },
              { translateY: -height / 2 },
            ],
          }}
        >
          {sideTooltip}
        </View>
      ) : null}
    </View>
  );
};
