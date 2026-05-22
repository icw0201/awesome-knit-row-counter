import React, { useState } from 'react';
import { View, DimensionValue } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { appTheme } from '@styles/appTheme';

// ===== 타입 정의 =====
interface ModalHandleProps {
  isOpen: boolean;
  height: number;
  handleWidth: number;
  modalWidth: number;
  translateX: number;
  centerY: DimensionValue;
  onOpen: () => void;
  onClose: () => void;
  onToggle?: () => void;
  onDragUpdate: (translateX: number) => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  currentX: number;
  startTranslateX: number;
}

// ===== 상수 =====
const DRAG_THRESHOLD = 20; // 드래그 감지 임계값 (px)
const OPEN_THRESHOLD = 50; // 모달 열기 임계값 (px)
const CLOSE_THRESHOLD = 30; // 모달 닫기 임계값 (px)

// ===== 핸들 컴포넌트 =====
export const ModalHandle: React.FC<ModalHandleProps> = ({
  height,
  handleWidth,
  modalWidth,
  translateX,
  centerY,
  onOpen,
  onClose,
  onDragUpdate,
}) => {
  // ===== 드래그 상태 관리 =====
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    currentX: 0,
    startTranslateX: 0,
  });

  const clampTranslateX = (value: number) => {
    return Math.max(handleWidth, Math.min(modalWidth, value));
  };

  const getIsOpenByTranslateX = (value: number) => {
    // 위치 기반 판정: 절반 이상 열려있으면 open 처리
    return value >= (handleWidth + modalWidth) / 2;
  };

  // ===== 터치 이벤트 핸들러 =====

  // 터치 시작 이벤트 처리
  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent.touches[0];
    setDragState({
      isDragging: false,
      startX: touch.pageX,
      currentX: touch.pageX,
      startTranslateX: translateX,
    });
  };

  // 터치 이동 이벤트 처리 (드래그)
  const handleTouchMove = (e: any) => {
    const touch = e.nativeEvent.touches[0];
    const deltaX = touch.pageX - dragState.startX;
    const shouldDrag = Math.abs(deltaX) > DRAG_THRESHOLD;

    // 드래그 상태로 전환
    if (shouldDrag && !dragState.isDragging) {
      setDragState((prev) => ({ ...prev, isDragging: true }));
    }

    // isOpen prop에 의존하지 않고, 현재 위치 기준으로 양방향 드래그 허용
    if (shouldDrag) {
      const newTranslateX = clampTranslateX(dragState.startTranslateX + deltaX);
      onDragUpdate(newTranslateX);
      setDragState((prev) => ({ ...prev, currentX: touch.pageX }));
    }
  };

  // 터치 종료 이벤트 처리 (드래그 완료)
  const handleTouchEnd = () => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
    const deltaX = dragState.currentX - dragState.startX;
    const endTranslateX = clampTranslateX(dragState.startTranslateX + deltaX);
    const isOpenByPosition = getIsOpenByTranslateX(endTranslateX);

    // 원래 코드의 "조금만 드래그하면 복귀" 감각을 유지하기 위해
    // 방향/거리 기반 임계값을 우선 적용, 아니면 위치(중앙값)으로 결정
    if (deltaX > OPEN_THRESHOLD) {
      onOpen();
      return;
    }
    if (deltaX < -CLOSE_THRESHOLD) {
      onClose();
      return;
    }

    if (isOpenByPosition) {
      onOpen();
    } else {
      onClose();
    }
  };

  // 단순 터치 이벤트 처리 (드래그가 아닌 경우)
  const handlePress = () => {
    const deltaX = Math.abs(dragState.currentX - dragState.startX);
    if (deltaX > DRAG_THRESHOLD) {
      return; // 드래그로 간주
    }

    // 현재 위치 기반으로 토글 (부모 isOpen이 늦게 갱신되어도 동작 보장)
    const isOpenByPosition = getIsOpenByTranslateX(translateX);
    if (isOpenByPosition) {
      onClose();
    } else {
      onOpen();
    }
  };

  // 터치 종료 시 드래그/터치 구분 처리
  const handleTouchEndWithCheck = () => {
    const deltaX = Math.abs(dragState.currentX - dragState.startX);

    if (deltaX <= DRAG_THRESHOLD) {
      // 드래그가 아닌 단순 터치
      handlePress();
    } else {
      // 드래그
      handleTouchEnd();
    }
  };
  return (
    <View
      className="absolute bg-transparent"
      style={{
        top: centerY,
        left: -handleWidth,
        width: handleWidth,
        height: height,
        zIndex: 2,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        transform: [
          { translateX: translateX },
          { translateY: -height / 2 },
        ],
      }}
      focusable={false}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEndWithCheck}
    >
      {getIsOpenByTranslateX(translateX) ? (
        // 열려있을 때: 투명한 핸들 + 흰색 바
        <View className="w-full h-full items-center justify-center">
          <View
            className={`w-1 ${appTheme.tw.bg.primary['100']} rounded-sm`}
            style={{ height: height * 0.4 }}
          />
        </View>
      ) : (
        // 닫혀있을 때: 그라데이션 핸들만 (바 없음)
        <View
          className="flex-1 border-t-2 border-r-2 border-white overflow-hidden"
          style={{
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <LinearGradient
            colors={[appTheme.colors.primary['400'], appTheme.colors.primary['200']]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            className="flex-1"
          />
        </View>
      )}
    </View>
  );
};

