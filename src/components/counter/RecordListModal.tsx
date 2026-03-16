import React from 'react';
import { Text, View } from 'react-native';
import { ScrollModal } from '@components/common/modals';

interface RecordListModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  records: string[];
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
          <View
            key={`${record}-${index}`}
            className={index === 2 ? 'border-b border-red-orange-400 py-1.5 pb-2 mb-1.5' : 'py-1.5'}
          >
            <Text className="text-sm text-black">
              {record}
            </Text>
          </View>
        ))
      ) : (
        <Text className="py-3 text-center text-sm text-darkgray">활동 기록이 없습니다</Text>
      )}
    </ScrollModal>
  );
};

export default RecordListModal;
