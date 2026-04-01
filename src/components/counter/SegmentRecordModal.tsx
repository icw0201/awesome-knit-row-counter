import React, { useMemo, useState } from 'react';
import { View, Text, DimensionValue } from 'react-native';
import { SlideModal } from '@components/common/modals/SlideModal/SlideModal';
import { ScreenSize, SEGMENT_UNDO_ICON_SIZE } from '@constants/screenSizeConfig';
import { SectionRecord } from '@storage/types';
import { getEditContentText } from '@utils/sectionRecordUtils';
import CircleIcon from '@components/common/CircleIcon';
import RecordListModal from './RecordListModal';
import Tooltip from '@components/common/Tooltip';
import { Mic } from 'lucide-react-native';

/**
 * SlideModal과 같은 부모 아래 형제로 둠. 패널(열린 상태, 왼쪽 정렬) 박스 밖·상단 Y에 툴팁을 붙임.
 * 패널 밖 배치를 위해 오버레이로 처리.
 */
const SegmentRecordAbovePanelTooltipOverlay: React.FC<{
  panelWidth: number;
  panelHeight: number;
  centerYPx: number;
  children: React.ReactNode;
}> = ({ panelWidth, panelHeight, centerYPx, children }) => {
  const gapPx = 8;
  const modalTopPx = centerYPx - panelHeight / 2;
  if (modalTopPx <= gapPx) {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      className="absolute top-0 left-0 right-0 bottom-0"
      style={{ zIndex: 52 }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          width: panelWidth,
          top: 0,
          height: modalTopPx - gapPx,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
};

// ===== 타입 정의 =====
interface SegmentRecordModalProps {
  isOpen: boolean;
  onToggle: () => void;
  onUndo: () => void;
  handleWidth?: number;
  screenSize: ScreenSize;
  width: number;
  height: number;
  centerY: DimensionValue;
  sectionRecords?: SectionRecord[];
  /** SlideModal 패널 오른쪽에 표시 */
  sideTooltip?: React.ReactNode;
  /** 툴팁 설정 on일 때, 모달 패널 밖(상단 Y) 안내(4초). 기록이 있을 때만 */
  inlineRecordTooltipEnabled?: boolean;
}

// ===== 메인 컴포넌트 =====
export const SegmentRecordModal: React.FC<SegmentRecordModalProps> = ({
  isOpen,
  onToggle,
  onUndo,
  handleWidth = 30,
  screenSize: _screenSize,
  width,
  height,
  centerY,
  sectionRecords = [],
  sideTooltip,
  inlineRecordTooltipEnabled = false,
}) => {
  const [showAllRecordsModal, setShowAllRecordsModal] = useState(false);

  const recentRecords = useMemo(() => sectionRecords.slice(0, 3), [sectionRecords]);

  return (
    <>
      <SlideModal
        isOpen={isOpen}
        onToggle={onToggle}
        height={height}
        width={width}
        handleWidth={handleWidth}
        backgroundColor="white"
        padding={0}
        centerY={centerY}
        sideTooltip={sideTooltip}
      >
        {/* 콘텐츠 영역 */}
        <View
          className="flex-1 justify-center px-4"
          style={{ paddingLeft: handleWidth + 16 }}
        >
          {sectionRecords.length > 0 ? (
            <View className="flex-row items-center justify-between">
              {/* 최신 3개 기록 요약 - 터치 시 전체 기록 모달 표시 */}
              <View
                className="flex-[0.8] items-center"
                focusable={false}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                onStartShouldSetResponder={() => true}
                onResponderRelease={() => setShowAllRecordsModal(true)}
              >
                <View className="w-full items-start">
                  {recentRecords.map((record, index) => {
                    // 첫 번째: black, 두 번째: darkgray, 세 번째: mediumgray
                    const textColorClass = index === 0 ? 'text-black' : index === 1 ? 'text-darkgray' : 'text-mediumgray';
                    const micColor = index === 0 ? '#111111' : index === 1 ? '#767676' : '#B8B8B8';
                    return (
                      <View key={index} className="w-full">
                        <View className="max-w-full flex-row items-center self-start">
                          <Text
                            className={`shrink text-sm font-bold ${textColorClass}`}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          allowFontScaling={false}
                          >
                            {record.time} {getEditContentText(record)}
                          </Text>
                          {record.voiceCommand && (
                            <View className="ml-1 flex-row items-center">
                              <Mic size={14} color={micColor} strokeWidth={2} />
                              <Text
                                className={`ml-1 text-sm font-bold ${textColorClass}`}
                                allowFontScaling={false}
                              >
                                {record.voiceCommand}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
              {/* 실행 취소 버튼 - 20% 너비 */}
              <View className="flex-[0.2] items-end">
                <CircleIcon
                  size={SEGMENT_UNDO_ICON_SIZE}
                  iconName="eraser"
                  colorStyle="light"
                  isButton
                  onPress={onUndo}
                />
              </View>
            </View>
          ) : (
            <View className="items-center justify-center">
              <Text className="text-sm text-darkgray" allowFontScaling={false}>
                활동 기록이 없습니다
              </Text>
            </View>
          )}
        </View>
      </SlideModal>

      {isOpen &&
      inlineRecordTooltipEnabled &&
      sectionRecords.length > 0 &&
      typeof centerY === 'number' ? (
        <SegmentRecordAbovePanelTooltipOverlay
          panelWidth={width}
          panelHeight={height}
          centerYPx={centerY}
        >
          <Tooltip placement="bottom" text="터치하여 기록 더보기" />
        </SegmentRecordAbovePanelTooltipOverlay>
      ) : null}

      <RecordListModal
        visible={showAllRecordsModal}
        onClose={() => setShowAllRecordsModal(false)}
        title="활동 기록(최신 30개)"
        records={sectionRecords}
      />
    </>
  );
};

export default SegmentRecordModal;

