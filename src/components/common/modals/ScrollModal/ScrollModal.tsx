import React from 'react';
import { ScrollView, View } from 'react-native';
import { BaseModal } from '../BaseModal';
import RoundedButton from '@components/common/RoundedButton';

interface ScrollModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: number;
}

const ScrollModal: React.FC<ScrollModalProps> = ({
  visible,
  onClose,
  title,
  children,
  maxHeight = 360,
}) => {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={title}
    >
      <View className="w-full">
        <ScrollView
          className="w-full min-w-[272px]"
          style={{ maxHeight }}
          showsVerticalScrollIndicator
          persistentScrollbar
          nestedScrollEnabled
        >
          <View className="w-full py-1">
            {children}
          </View>
        </ScrollView>
      </View>

      <View className="mt-2 items-center">
        <RoundedButton
          title="닫기"
          onPress={onClose}
          colorStyle="vivid"
        />
      </View>
    </BaseModal>
  );
};

export default ScrollModal;
