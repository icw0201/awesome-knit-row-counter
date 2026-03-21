import React, { Fragment } from 'react';
import { Text, View } from 'react-native';
import { Cherry } from 'lucide-react-native';
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
          <Fragment key={`${record}-${index}`}>
            <View className="py-1.5">
              <Text className="text-sm text-black">
                {record}
              </Text>
            </View>
            {index === 2 && (
              <View className="my-1.5 w-full flex-row items-center justify-center">
                <View className="h-px w-20 bg-red-orange-400" />
                <View className="mx-2">
                  <Cherry size={14} color="#ff6b67" />
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
