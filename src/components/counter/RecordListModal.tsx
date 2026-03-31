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
          <Fragment key={`${record.date}-${record.time}-${index}`}>
            <View className="py-1.5">
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
            {index === 2 && (
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
