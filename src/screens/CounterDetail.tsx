// src/screens/CounterDetail.tsx

import { useLayoutEffect, useCallback, useState, useRef } from 'react';
import { View, Text, useWindowDimensions, Animated, LayoutChangeEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';

import { getHeaderRightWithActivateInfoSettings } from '@navigation/HeaderOptions';

import { CounterTouchArea, CounterDirection, CounterActions, CounterModals, SubCounterModal, ProgressBar, TimeDisplay, SegmentRecordModal } from '@components/counter';
import Tooltip from '@components/common/Tooltip';
import { getScreenSize, getIconSize, getProgressBarHeightPx, getTextClass, ScreenSize } from '@constants/screenSizeConfig';
import { getTooltipEnabledSetting } from '@storage/settings';
import { screenStyles } from '@styles/screenStyles';
import { useCounter } from '@hooks/useCounter';
import { getContentSectionFlexes, getCounterDetailModalLayout, getCounterDetailVerticalPercents, getCounterDetailVerticalPx, getCounterDetailVisibility } from '@utils/counterDetailLayout';


/**
 * 카운터 상세 화면 컴포넌트
 *
 * 이 화면은 사용자가 프로젝트나 독립 카운터의 숫자를 증가/감소시키고,
 * 다양한 설정(활성화 모드, 방향, 사운드, 진동)을 관리할 수 있는 핵심 화면입니다.
 *
 * 주요 기능:
 * - 좌우 터치로 숫자 증가/감소
 * - 활성화 모드 전환 (비활성/자동)
 * - 방향 전환 (앞/뒤)
 * - 사운드 및 진동 피드백
 * - 화면 켜짐 유지
 * - 카운트 편집 및 초기화
 * - 반응형 UI (화면 크기에 따른 레이아웃 조정)
 */
const CounterDetail = () => {
  // 네비게이션 및 라우트 객체
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { counterId } = route.params as { counterId: string };

  // 화면 크기 정보 (실제 렌더 영역과 동일한 좌표계 사용)
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ESTIMATED_HEADER_HEIGHT = 56;
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(0);
  // screenSize 판정: layoutHeight를 "window 높이"로 정규화하여 사용.
  // 헤더 유무에 따라 layoutHeight가 ~56px 달라지므로, 이전 렌더의 screenSize를
  // 참조하여 헤더가 표시된 상태였으면 헤더 높이를 더해 일관된 기준 높이를 산출.
  // 이를 통해 COMPACT↔SMALL 경계에서의 무한 토글(깜빡임)을 방지하면서도
  // onLayout 기반이라 Dimensions stale 문제도 회피
  const prevScreenSizeRef = useRef<ScreenSize | null>(null);
  let screenSizeJudgeHeight: number;
  if (layoutHeight > 0) {
    const headerWasShown =
      prevScreenSizeRef.current !== null &&
      prevScreenSizeRef.current !== ScreenSize.COMPACT;
    screenSizeJudgeHeight = layoutHeight + (headerWasShown ? ESTIMATED_HEADER_HEIGHT : 0);
  } else {
    // 첫 onLayout 전: stale height가 작을 수 있으므로 최소 LARGE(501)를 보장.
    // COMPACT→LARGE 전환 시 headerShown 타이밍 차이로 콘텐츠가 헤더와 겹치는 문제 방지.
    // 실제 작은 화면이면 onLayout 후 LARGE→COMPACT로 전환 (이 방향은 안전)
    screenSizeJudgeHeight = Math.max(height - insets.bottom, 501);
  }
  const screenSize = getScreenSize(screenSizeJudgeHeight);
  prevScreenSizeRef.current = screenSize;
  // onLayout 기반 가로. Dimensions stale 방지 (세로와 동일한 이유)
  const resolvedWidth = layoutWidth > 0 ? layoutWidth : width;
  // 모달/메인 배치는 실제 렌더 높이(onLayout)를 기준으로 계산.
  // onLayout 전 초기값: 헤더 표시 시 예상 헤더 높이를 빼서 점프 완화
  const contentAreaHeight = layoutHeight > 0
    ? layoutHeight
    : Math.max(0, height - insets.bottom - (screenSize !== ScreenSize.COMPACT ? ESTIMATED_HEADER_HEIGHT : 0));
  const iconSize = getIconSize(screenSize);
  const textClass = getTextClass(screenSize);
  const progressBarHeightPx = getProgressBarHeightPx(screenSize);


  // 카운터 비즈니스 로직 훅
  const {
    counter,
    wayIsChange,
    mascotIsActive,
    way,
    currentCount,
    currentTargetCount,
    activeModal,
    errorModalVisible,
    errorMessage,
    handleAdd,
    handleSubtract,
    handleEditOpen,
    handleEditConfirm,
    handleResetConfirm,
    handleClose,
    handleTargetCountOpen,
    handleTargetCountConfirm,
    toggleMascotIsActive,
    toggleWay,
    toggleTimerIsActive,
    toggleTimerIsPlaying,
    handleTimerResetConfirm,
    setErrorModalVisible,
    setActiveModal,
    // 보조 카운터 관련
    subCount,
    subRule,
    subRuleIsActive,
    subModalIsOpen,
    handleSubAdd,
    handleSubSubtract,
    handleSubReset,
    handleSubEdit,
    handleSubRule,
    handleSubResetConfirm,
    handleSubEditConfirm,
    handleSubRuleConfirm,
    handleSubModalToggle,
    // 구간 기록 모달
    handleSectionModalToggle,
    handleSectionUndo,
  } = useCounter({ counterId });

  const [tooltipEnabled, setTooltipEnabled] = useState(true);

  // 방향 이미지 크기 계산 (원본 비율 90 / 189 유지)
  const imageWidth = iconSize * 1.4;
  const imageHeight = iconSize * (90 / 189) * 1.4;
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height: nextHeight, width: nextWidth } = event.nativeEvent.layout;
    setLayoutHeight((prev) => (prev !== nextHeight ? nextHeight : prev));
    setLayoutWidth((prev) => (prev !== nextWidth ? nextWidth : prev));
  }, []);

  const { timerEndPercent, contentStartPercent, contentEndPercent } =
    getCounterDetailVerticalPercents(screenSize);
  const {
    subModalWidth,
    subModalHeight,
    subModalCenterY,
    subModalHandleWidth,
    segmentModalWidth,
    segmentModalHeight,
    segmentModalCenterY,
  } = getCounterDetailModalLayout(contentAreaHeight, resolvedWidth, screenSize);
  const { showTimeDisplay, showCounterActions, shouldStartContentFromTop } =
    getCounterDetailVisibility({
      screenSize,
      timerIsActive: counter?.timerIsActive ?? false,
      subModalIsOpen,
    });
  const { directionSectionFlex, countSectionFlex, actionsSectionFlex } =
    getContentSectionFlexes(mascotIsActive, showCounterActions);
  const { timerHeightPx, gapBetweenTimerAndContentPx, contentHeightPx, bottomReservedHeightPx } =
    getCounterDetailVerticalPx({
      contentAreaHeight,
      progressBarHeightPx,
      timerEndPercent,
      contentStartPercent,
      contentEndPercent,
      shouldStartContentFromTop,
    });
  const countSectionHeightPx = contentHeightPx * countSectionFlex;
  const digitCount = Math.max(1, String(counter?.count ?? 0).length);
  const CHAR_WIDTH_RATIO = 0.6; // 숫자 1글자 너비 ≈ fontSize * 비율
  const maxFontSizeByHeight = countSectionHeightPx * 0.8;
  const maxFontSizeByWidth = (resolvedWidth * 0.5) / (digitCount * CHAR_WIDTH_RATIO);
  const countTextFontSizePx = Math.max(0, Math.min(maxFontSizeByHeight, maxFontSizeByWidth));

  /**
   * 화면 포커스 시 실행되는 효과
   * 화면 켜짐 상태 관리만 담당합니다.
   */
  useFocusEffect(
    useCallback(() => {
      // 툴팁 표시 설정 로드
      setTooltipEnabled(getTooltipEnabledSetting());
    }, [])
  );


  /**
   * 헤더 옵션 설정
   * 화면 크기와 카운터 상태에 따라 헤더를 동적으로 구성합니다.
   */
  useLayoutEffect(() => {
    if (!counter) {
      return;
    }

    navigation.setOptions({
      title: counter.title,
      headerShown: screenSize !== ScreenSize.COMPACT,
      headerRight: () =>
        getHeaderRightWithActivateInfoSettings(
          navigation,
          mascotIsActive,
          toggleMascotIsActive,
          counter.timerIsActive,
          toggleTimerIsActive,
          counter.id,
          () => navigation.navigate('InfoScreen', { itemId: counter.id })
        ),
    });
  }, [navigation, counter, mascotIsActive, screenSize, resolvedWidth, toggleMascotIsActive, toggleTimerIsActive]);


  // 카운터 데이터가 없으면 렌더링하지 않음
  if (!counter) {
    return null;
  }

  return (
    <SafeAreaView
      style={screenStyles.flex1}
      edges={screenSize === ScreenSize.COMPACT
        ? (['left', 'right', 'bottom', 'top'] as Edge[])
        : (['left', 'right', 'bottom'] as Edge[])}
    >
      <View className="flex-1 bg-white" onLayout={handleLayout}>

      {/* 좌우 터치 레이어 */}
      <CounterTouchArea onAdd={handleAdd} onSubtract={handleSubtract} />

      {/* 중앙 콘텐츠 영역 */}
      <Animated.View
        className="flex-1 items-center justify-center"
        style={[
          screenStyles.pointerEventsBoxNone,
          {
            opacity: 1,
          },
        ]}
      >
        {/* 프로그레스 바 - 화면 최상단에 고정 */}
        <ProgressBar
          count={counter.count}
          targetCount={counter.targetCount || 0}
          screenSize={screenSize}
          onPress={handleTargetCountOpen}
        />

        {/* 헤더 활성 아이콘 안내 툴팁 (헤더 대신 화면 위층에 표시) */}
        {screenSize !== ScreenSize.COMPACT && tooltipEnabled && (
          <Tooltip
            text="길게 눌러 어쩌미 알림 단 설정하기"
            containerClassName="absolute right-3 top-2 z-50"
            targetAnchorX={resolvedWidth - 106}
          />
        )}

        <View className="absolute left-0 right-0 bottom-0 w-full items-center justify-start" style={{ top: progressBarHeightPx }}>
          {/* 타이머 영역 (bands의 timerEndPercent 기준) */}
          <View className="w-full items-center justify-center" style={{ height: timerHeightPx }}>
            {showTimeDisplay && (
              <TimeDisplay
                screenSize={screenSize}
                timerIsPlaying={counter.timerIsPlaying ?? false}
                elapsedTime={counter.elapsedTime ?? 0}
                onPress={toggleTimerIsPlaying}
                onLongPress={() => setActiveModal('timerReset')}
              />
            )}
          </View>

          {/* 구간 기록 모달 자리 (bands의 contentStartPercent - timerEndPercent) */}
          <View style={{ height: gapBetweenTimerAndContentPx }} />

          {/* 방향/숫자/버튼 (bands의 contentStartPercent ~ contentEndPercent). mascotIsActive일 때만 디렉션, 아니면 숫자·버튼 0.6 : 0.4 */}
          <View className="w-full items-center" style={{ height: contentHeightPx }}>
            <View className="w-full flex-1">
              {mascotIsActive && (
                <View className="items-center justify-center w-full" style={{ flex: directionSectionFlex }}>
                  <CounterDirection
                    mascotIsActive={mascotIsActive}
                    wayIsChange={wayIsChange}
                    way={way}
                    currentCount={counter.count}
                    repeatRules={counter.repeatRules || []}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    onToggleWay={toggleWay}
                  />
                </View>
              )}
              <View
                className="items-center justify-center w-full"
                style={{ flex: countSectionFlex }}
                pointerEvents="none"
              >
                <Text
                  className={`${textClass} font-bold text-black`}
                  style={{ fontSize: countTextFontSizePx, lineHeight: countTextFontSizePx }}
                >
                  {counter.count}
                </Text>
              </View>
              {showCounterActions && (
                <View className="items-center justify-center w-full" style={{ flex: actionsSectionFlex }}>
                  <CounterActions
                    screenSize={screenSize}
                    iconSize={iconSize}
                    onReset={() => setActiveModal('reset')}
                    onEdit={handleEditOpen}
                  />
                </View>
              )}
            </View>
          </View>

          {/* 서브 모달 아래 영역 예약 (bands 기준 나머지) */}
          <View style={{ height: bottomReservedHeightPx }} />
        </View>
      </Animated.View>

      {/* 구간 기록 모달 - LARGE 화면에서만 표시 */}
      {screenSize === ScreenSize.LARGE && (
        <SegmentRecordModal
          isOpen={counter.sectionModalIsOpen ?? false}
          onToggle={handleSectionModalToggle}
          onUndo={handleSectionUndo}
          screenSize={screenSize}
          width={segmentModalWidth}
          height={segmentModalHeight}
          centerY={segmentModalCenterY}
          sectionRecords={counter.sectionRecords}
        />
      )}

      {/* 보조 카운터 모달 */}
      <SubCounterModal
        isOpen={subModalIsOpen}
        onToggle={handleSubModalToggle}
        onAdd={handleSubAdd}
        onSubtract={handleSubSubtract}
        onReset={handleSubReset}
        onEdit={handleSubEdit}
        onRule={handleSubRule}
        handleWidth={subModalHandleWidth}
        subCount={subCount}
        subRule={subRule}
        subRuleIsActive={subRuleIsActive}
        screenSize={screenSize}
        width={subModalWidth}
        height={subModalHeight}
        centerY={subModalCenterY}
      />

      {/* 모달들 */}
      <CounterModals
        activeModal={activeModal}
        errorModalVisible={errorModalVisible}
        errorMessage={errorMessage}
        currentCount={currentCount}
        currentTargetCount={currentTargetCount}
        subCount={subCount}
        subRule={subRule}
        subRuleIsActive={subRuleIsActive}
        onClose={handleClose}
        onEditConfirm={handleEditConfirm}
        onResetConfirm={handleResetConfirm}
        onTimerResetConfirm={handleTimerResetConfirm}
        onErrorModalClose={() => setErrorModalVisible(false)}
        onTargetCountConfirm={handleTargetCountConfirm}
        onSubEditConfirm={handleSubEditConfirm}
        onSubResetConfirm={handleSubResetConfirm}
        onSubRuleConfirm={handleSubRuleConfirm}
      />
      </View>
    </SafeAreaView>
  );
};

export default CounterDetail;
