// src/screens/CounterDetail.tsx

import { useLayoutEffect, useCallback, useState, useRef, useEffect } from 'react';
import { View, useWindowDimensions, Animated, LayoutChangeEvent, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import KeyEvent from 'react-native-keyevent';

import { getHeaderRightWithActivateInfoSettings } from '@navigation/HeaderOptions';

import { AnimatedCounterDigits, CounterTouchArea, CounterDirection, CounterActions, CounterModals, SubCounterModal, ProgressBar, TimeDisplay, SegmentRecordModal, VoiceRecognitionBanner } from '@components/counter';
import Tooltip from '@components/common/Tooltip';
import {
  ADD_KEY_CODES,
  SUBTRACT_KEY_CODES,
  SUB_COUNTER_ADD_KEY_CODES,
  SUB_COUNTER_SUBTRACT_KEY_CODES,
} from '@constants/hardwareKeyCodes';
import { getScreenSize, getIconSize, getProgressBarHeightPx, getTextClass, ScreenSize } from '@constants/screenSizeConfig';
import {
  getEffectiveVoiceCommandSetting,
  getTooltipEnabledSetting,
  getSubSlideModalsEnabledSetting,
  setSubSlideModalsEnabledSetting,
  subscribeSubSlideModalsEnabledSettingChange,
} from '@storage/settings';
import { screenStyles } from '@styles/screenStyles';
import { useCounter } from '@hooks/useCounter';
import { useVoiceCommands } from '@hooks/useVoiceCommands';
import { useVoiceBannerText } from '@hooks/useVoiceBannerText';
import { useTimedHighlight } from '@hooks/useTimedHighlight';
import { useVoicePermissionGate } from '@hooks/useVoicePermissionGate';
import { getContentSectionFlexes, getCounterDetailModalLayout, getCounterDetailVerticalPercents, getCounterDetailVerticalPx, getCounterDetailVisibility } from '@utils/counterDetailLayout';

type HardwareKeyUpEvent = {
  keyCode: number;
};

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
  const [subSlideModalsEnabled, setSubSlideModalsEnabled] = useState(
    () => getSubSlideModalsEnabledSetting()
  );
  const [voiceCommandSetting, setVoiceCommandSetting] = useState(() =>
    getEffectiveVoiceCommandSetting()
  );
  const [voiceRecognitionError, setVoiceRecognitionError] = useState<string>('');
  const {
    isVoiceCommandsEnabled,
    isVoiceCommandsActive,
    voicePermissionModalVisible,
    voicePermissionModalTitle,
    voicePermissionModalDescription,
    voicePermissionModalConfirmText,
    voicePermissionModalCancelText,
    voicePermissionError,
    voiceMicPrimerModalVisible,
    closeVoicePermissionModal,
    handleVoicePermissionModalConfirm,
    closeVoiceMicPrimerModal,
    handleVoiceMicPrimerModalConfirm,
    toggleVoiceCommands,
  } = useVoicePermissionGate();
  const isInputBlocked =
    activeModal !== null ||
    errorModalVisible ||
    voicePermissionModalVisible ||
    voiceMicPrimerModalVisible;
  const effectiveVoiceCommandsActive = isVoiceCommandsActive && !isInputBlocked;
  const {
    voiceRecognizedText,
    isVoiceTextResetPending,
    handleVoiceRecognizedTextChange,
    handleVoiceTextLayout,
  } = useVoiceBannerText({ isVoiceCommandsActive: effectiveVoiceCommandsActive });
  const voiceError = voicePermissionError || voiceRecognitionError;
  const {
    highlightedAction: touchAreaHighlight,
    flashHighlight: flashTouchAreaHighlight,
  } = useTimedHighlight(100);
  const {
    highlightedAction: subTouchAreaHighlight,
    flashHighlight: flashSubTouchAreaHighlight,
  } = useTimedHighlight(100);

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
  const showVoiceBanner =
    screenSize === ScreenSize.LARGE && effectiveVoiceCommandsActive;
  const { directionSectionFlex, voiceBannerSectionFlex, countSectionFlex, actionsSectionFlex } =
    getContentSectionFlexes(mascotIsActive, showCounterActions, showVoiceBanner);
  const showSlideModalSideTooltips = tooltipEnabled && screenSize !== ScreenSize.COMPACT;
  const { timerHeightPx, gapBetweenTimerAndContentPx, contentHeightPx, bottomReservedHeightPx } =
    getCounterDetailVerticalPx({
      contentAreaHeight,
      progressBarHeightPx,
      timerEndPercent,
      contentStartPercent,
      contentEndPercent,
      shouldStartContentFromTop,
    });
  const voiceBannerHeightPx = contentHeightPx * voiceBannerSectionFlex;
  const countSectionHeightPx = contentHeightPx * countSectionFlex;
  const shouldFillCountVertically = mascotIsActive && showVoiceBanner;
  const digitCount = Math.max(1, String(counter?.count ?? 0).length);
  const CHAR_WIDTH_RATIO = 0.6; // 숫자 1글자 너비 ≈ fontSize * 비율
  const maxFontSizeByHeight = countSectionHeightPx * (shouldFillCountVertically ? 1 : 0.8); //음성인식, 방향이가 활성화 된 경우 글자 차지 세로 영역 1로 증가
  const maxFontSizeByWidth =
    (resolvedWidth * (shouldFillCountVertically ? 0.8 : 0.5)) / (digitCount * CHAR_WIDTH_RATIO);
  const countTextFontSizePx = Math.max(0, Math.min(maxFontSizeByHeight, maxFontSizeByWidth));

  /**
   * 메인 카운터 공통 진입점.
   * 터치/키보드/보이스 모두 같은 함수로 들어와 하이라이트와 실제 비즈니스 로직을 함께 실행한다.
   */
  const runHighlightedAdd = useCallback((commandWord?: string) => {
    if (isInputBlocked) {
      return;
    }
    flashTouchAreaHighlight('add');
    handleAdd(commandWord);
  }, [flashTouchAreaHighlight, handleAdd, isInputBlocked]);

  const runHighlightedSubtract = useCallback((commandWord?: string) => {
    if (isInputBlocked) {
      return;
    }
    flashTouchAreaHighlight('subtract');
    handleSubtract(commandWord);
  }, [flashTouchAreaHighlight, handleSubtract, isInputBlocked]);

  /**
   * 보조 카운터 공통 진입점.
   * 터치/보이스 모두 같은 함수로 들어와 하이라이트와 실제 비즈니스 로직을 함께 실행한다.
   * 서브 슬라이드가 꺼져 있거나 모달이 닫혀 있으면 음성·하드웨어 방향키만 막는다(모달 터치는 열린 상태에서만 발생).
   */
  const runHighlightedSubAdd = useCallback((commandWord?: string) => {
    if (isInputBlocked) {
      return;
    }
    if (!subSlideModalsEnabled || !subModalIsOpen) {
      return;
    }
    flashSubTouchAreaHighlight('add');
    handleSubAdd(commandWord);
  }, [flashSubTouchAreaHighlight, handleSubAdd, isInputBlocked, subModalIsOpen, subSlideModalsEnabled]);

  const runHighlightedSubSubtract = useCallback((commandWord?: string) => {
    if (isInputBlocked) {
      return;
    }
    if (!subSlideModalsEnabled || !subModalIsOpen) {
      return;
    }
    flashSubTouchAreaHighlight('subtract');
    handleSubSubtract(commandWord);
  }, [flashSubTouchAreaHighlight, handleSubSubtract, isInputBlocked, subModalIsOpen, subSlideModalsEnabled]);

  /** 화면 포커스 중일 때만 계속 듣고, "연지" 계열 → 감소, "곤지" 계열 → 증가 */
  useVoiceCommands(
    !!counter && effectiveVoiceCommandsActive,
    voiceCommandSetting,
    runHighlightedAdd,
    runHighlightedSubtract,
    runHighlightedSubAdd,
    runHighlightedSubSubtract,
    handleVoiceRecognizedTextChange,
    setVoiceRecognitionError
  );

  /**
   * 화면 포커스 시 실행되는 효과
   * 툴팁/음성 명령어 설정을 다시 반영한다.
   */
  useFocusEffect(
    useCallback(() => {
      setTooltipEnabled(getTooltipEnabledSetting());
      setVoiceCommandSetting(getEffectiveVoiceCommandSetting());
    }, [])
  );

  useEffect(() => {
    const syncSubSlideModalsEnabled = () => {
      setSubSlideModalsEnabled(getSubSlideModalsEnabledSetting());
    };

    syncSubSlideModalsEnabled();

    return subscribeSubSlideModalsEnabledSettingChange(syncSubSlideModalsEnabled);
  }, []);

  const toggleSubSlideModalsEnabled = useCallback(() => {
    const nextValue = !subSlideModalsEnabled;
    setSubSlideModalsEnabledSetting(nextValue);
    setSubSlideModalsEnabled(nextValue);
  }, [subSlideModalsEnabled]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }

      /**
       * 외장 키보드 key up 이벤트를 카운터 액션으로 매핑한다.
       *
       * - add 계열 키: 메인 증가
       * - subtract 계열 키: 메인 감소
       * - 위 방향키: 보조 증가
       * - 아래 방향키: 보조 감소
       *
       * 여기서 key down 대신 key up을 쓰는 이유는,
       * 키를 길게 누를 때 발생할 수 있는 연속 입력을 줄이고
       * "키를 뗄 때 1회 실행"이라는 더 안전한 동작을 만들기 위해서다.
       */
      const handleHardwareKeyUp = ({ keyCode }: HardwareKeyUpEvent) => {
        // 음성/편집/에러 모달이 떠 있는 동안은 하드웨어 키 입력도 함께 차단한다.
        if (isInputBlocked) {
          return;
        }

        if (ADD_KEY_CODES.has(keyCode)) {
          runHighlightedAdd();
        } else if (SUBTRACT_KEY_CODES.has(keyCode)) {
          runHighlightedSubtract();
        } else if (SUB_COUNTER_ADD_KEY_CODES.has(keyCode)) {
          runHighlightedSubAdd();
        } else if (SUB_COUNTER_SUBTRACT_KEY_CODES.has(keyCode)) {
          runHighlightedSubSubtract();
        }
      };

      KeyEvent.onKeyUpListener(handleHardwareKeyUp);

      return () => {
        // 화면 포커스를 잃으면 전역 key up 리스너를 반드시 제거한다.
        KeyEvent.removeKeyUpListener();
      };
    }, [
      isInputBlocked,
      runHighlightedAdd,
      runHighlightedSubtract,
      runHighlightedSubAdd,
      runHighlightedSubSubtract,
    ])
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
          counter.timerIsActive,
          toggleTimerIsActive,
          isVoiceCommandsEnabled,
          toggleVoiceCommands,
          subSlideModalsEnabled,
          toggleSubSlideModalsEnabled,
          counter.id,
          () => navigation.navigate('InfoScreen', { itemId: counter.id })
        ),
    });
  }, [
    navigation,
    counter,
    isVoiceCommandsEnabled,
    mascotIsActive,
    screenSize,
    subSlideModalsEnabled,
    toggleSubSlideModalsEnabled,
    toggleTimerIsActive,
    toggleVoiceCommands,
  ]);


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
      <CounterTouchArea
        onAdd={runHighlightedAdd}
        onSubtract={runHighlightedSubtract}
        highlightedAction={touchAreaHighlight}
        showVoiceCommandHints={effectiveVoiceCommandsActive}
        addVoiceHint={voiceCommandSetting.addHint}
        subtractVoiceHint={voiceCommandSetting.subtractHint}
        disabled={isInputBlocked}
      />

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

        <View
          className="absolute left-0 right-0 bottom-0 w-full items-center justify-start"
          style={{ top: progressBarHeightPx }}
        >
          {/* 타이머 영역 (bands의 timerEndPercent 기준) */}
          <View
            className="w-full items-center justify-center"
            style={{ height: timerHeightPx }}
          >
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
                <View
                  className="w-full items-center justify-center"
                  style={{ flex: directionSectionFlex }}
                >
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
              {showVoiceBanner && (
                <View
                  className="w-full items-center justify-center"
                  style={{ flex: voiceBannerSectionFlex }}
                >
                  <VoiceRecognitionBanner
                    visible={showVoiceBanner}
                    bannerHeight={voiceBannerHeightPx}
                    maxWidth={Math.max(0, resolvedWidth * 0.3)}
                    voiceError={voiceError}
                    recognizedText={voiceRecognizedText}
                    isResetPending={isVoiceTextResetPending}
                    onRecognizedTextLayout={handleVoiceTextLayout}
                  />
                </View>
              )}
              <View
                className="w-full items-center justify-center"
                style={{ flex: countSectionFlex }}
                pointerEvents="none"
              >
                <AnimatedCounterDigits
                  value={counter.count}
                  fontSize={countTextFontSizePx}
                  lineHeight={countTextFontSizePx}
                  textClass={textClass}
                />
              </View>
              {showCounterActions && (
                <View
                  className="w-full items-center justify-center"
                  style={{ flex: actionsSectionFlex }}
                >
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
      {screenSize === ScreenSize.LARGE && subSlideModalsEnabled && (
        <SegmentRecordModal
          isOpen={counter.sectionModalIsOpen ?? false}
          onToggle={handleSectionModalToggle}
          onUndo={handleSectionUndo}
          screenSize={screenSize}
          width={segmentModalWidth}
          height={segmentModalHeight}
          centerY={segmentModalCenterY}
          sectionRecords={counter.sectionRecords}
          inlineRecordTooltipEnabled={showSlideModalSideTooltips}
          sideTooltip={
            showSlideModalSideTooltips ? (
              <Tooltip
                placement="left"
                text="활동 기록 보기"
                visuallyHidden={!!(counter.sectionModalIsOpen ?? false)}
              />
            ) : undefined
          }
        />
      )}

      {/* 보조 카운터 모달 */}
      {subSlideModalsEnabled && (
        <SubCounterModal
          isOpen={subModalIsOpen}
          onToggle={handleSubModalToggle}
          onAdd={runHighlightedSubAdd}
          onSubtract={runHighlightedSubSubtract}
          showVoiceCommandHints={effectiveVoiceCommandsActive}
          addVoiceHint={voiceCommandSetting.subAddHint}
          subtractVoiceHint={voiceCommandSetting.subSubtractHint}
          highlightedAction={subTouchAreaHighlight}
          inputDisabled={isInputBlocked}
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
          sideTooltip={
            showSlideModalSideTooltips ? (
              <Tooltip
                placement="left"
                text="보조 카운터 사용하기"
                visuallyHidden={subModalIsOpen}
              />
            ) : undefined
          }
        />
      )}

      {/* 모달들 */}
      <CounterModals
        activeModal={activeModal}
        errorModalVisible={errorModalVisible}
        errorMessage={errorMessage}
        voicePermissionModalVisible={voicePermissionModalVisible}
        voicePermissionModalTitle={voicePermissionModalTitle}
        voicePermissionModalDescription={voicePermissionModalDescription}
        voicePermissionModalConfirmText={voicePermissionModalConfirmText}
        voicePermissionModalCancelText={voicePermissionModalCancelText}
        voiceMicPrimerModalVisible={voiceMicPrimerModalVisible}
        onVoiceMicPrimerModalClose={closeVoiceMicPrimerModal}
        onVoiceMicPrimerModalConfirm={handleVoiceMicPrimerModalConfirm}
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
        onVoicePermissionModalClose={closeVoicePermissionModal}
        onVoicePermissionModalConfirm={handleVoicePermissionModalConfirm}
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
