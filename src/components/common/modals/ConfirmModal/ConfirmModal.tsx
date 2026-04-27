// src/components/common/modals/ConfirmModal/ConfirmModal.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { BaseModal } from '../BaseModal';
import RoundedButton from '@components/common/RoundedButton';
import { createModalStyles } from '@styles/modalStyle';

/**
 * ConfirmModal 컴포넌트의 Props 인터페이스
 * @param visible - 모달 표시 여부
 * @param onClose - 모달 닫기 콜백 함수
 * @param title - 모달 제목
 * @param description - 모달 설명
 * @param onConfirm - 확인 버튼 클릭 시 콜백 함수
 * @param confirmText - 확인 버튼 텍스트 (기본값: '확인')
 * @param cancelText - 취소 버튼 텍스트 (기본값: '취소')
 */
interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * 확인/취소 모달 컴포넌트
 * 사용자에게 확인을 받을 때 사용하는 모달입니다.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  title,
  description,
  onConfirm,
  confirmText = '확인',
  cancelText = '취소',
}) => {
  const modalStyles = createModalStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={title}
    >
      {/* 모달 설명 - 줄바꿈 지원 */}
      <Text style={modalStyles.description}>
        {description.split('\n').map((line, index) => (
          <Text key={index}>
            {line}
            {'\n'}
          </Text>
        ))}
      </Text>

      {/* 버튼 섹션 - 버튼 타입에 따라 다른 버튼 조합 표시 */}
      <View className="flex-row justify-evenly">
        {/* 취소 버튼 */}
        {cancelText && (
          <RoundedButton
            title={cancelText}
            onPress={onClose}
            colorStyle="light"
          />
        )}
        {/* 확인 버튼 */}
        <RoundedButton
          title={confirmText}
          onPress={handleConfirm}
          colorStyle="vivid"
        />
      </View>
    </BaseModal>
  );
};

export default ConfirmModal;
