import React, { Fragment } from 'react';
import { Text, View } from 'react-native';
import { ChevronDown, Mic } from 'lucide-react-native';
import { ScrollModal } from '@components/common/modals';
import { SectionRecord } from '@storage/types';
import { getEditContentText } from '@utils/sectionRecordUtils';
import { formatCompactDate } from '@utils/timeUtils';

interface RecordListModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  records: SectionRecord[];
}

/**
 * 구간 기록 전체 목록 모달.
 * - 최신 기록 배열을 순서대로 렌더링
 * - 날짜/편집 내용은 강조(볼드), 시간은 일반 두께로 표시
 * - 음성으로 실행된 기록은 마이크 아이콘과 명령어를 같은 줄에 보조 정보로 노출
 */
const RecordListModal: React.FC<RecordListModalProps> = ({
  visible,
  onClose,
  title,
  records,
}) => {
  return (
    <ScrollModal
      visible={visible}
      onClose={onClose}
      title={title}
      maxHeight={360}
    >
      {records.length > 0 ? (
        records.map((record, index) => (
          // index를 포함해 같은 시각 기록이 있어도 key 충돌을 피한다.
          <Fragment key={`${record.date}-${record.time}-${index}`}>
            <View className="py-1.5">
              {/* 본문 한 줄: 날짜(볼드) + 시간(일반) + 편집 내용(볼드) */}
              <View className="flex-row items-center">
                <Text
                  className="shrink text-sm text-black"
                  allowFontScaling={false}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  <Text className="font-bold">{formatCompactDate(record.date)}</Text>
                  <Text> {record.time} </Text>
                  <Text className="font-bold">{getEditContentText(record)}</Text>
                </Text>
                {record.voiceCommand && (
                  // 음성 명령은 줄바꿈 없이 우측 보조 정보로 붙여서 표시
                  <View className="ml-1 flex-row items-center">
                    <Mic size={12} color="#767676" strokeWidth={2} />
                    <Text
                      className="ml-1 text-sm text-darkgray"
                      allowFontScaling={false}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {record.voiceCommand}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {records.length > 3 && index === 2 && (
              // 요약 3개와 그 이후 기록의 시각적 경계를 위한 구분선
              <View className="my-1.5 w-full flex-row items-center justify-center">
                <View className="h-px w-20 bg-red-orange-400" />
                <View className="mx-2">
                  <ChevronDown size={14} color="#fc3e39" />
                </View>
                <View className="h-px w-20 bg-red-orange-400" />
              </View>
            )}
          </Fragment>
        ))
      ) : (
        <Text className="py-3 text-center text-sm text-darkgray">활동 기록이 없습니다</Text>
      )}
    </ScrollModal>
  );
};

export default RecordListModal;
