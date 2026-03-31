// src/components/common/modals/BaseModal/BaseModal.tsx
import React from 'react';
import { Modal, Text, Pressable, View } from 'react-native';
import { modalStyles } from '@styles/modalStyle';

/**
 * BaseModal 컴포넌트의 Props 인터페이스
 * @param visible - 모달 표시 여부
 * @param onClose - 모달 닫기 콜백 함수
 * @param title - 모달 제목
 * @param children - 모달 내용
 */
interface BaseModalProps {
  visible: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * 기본 모달 컴포넌트
 * 공통 모달 기능을 제공하며, children으로 내용을 받습니다.
 */
const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        {/* 배경 터치 영역 */}
        <Pressable style={modalStyles.backdrop} onPress={onClose} />

        {/* 모달 컨테이너 */}
        <View style={modalStyles.container}>
          {/* 모달 제목 */}
          <Text style={modalStyles.title}>{title}</Text>

          {/* 모달 내용 */}
          {children}
        </View>
      </View>
    </Modal>
  );
};

export default BaseModal;
