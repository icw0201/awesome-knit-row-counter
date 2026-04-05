// src/components/common/modals/BaseModal/BaseModal.tsx
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Modal, Text, Pressable, View, StyleSheet } from 'react-native';
import { usePreferReducedMotion } from '@hooks/usePreferReducedMotion';
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
  const preferReducedMotion = usePreferReducedMotion();
  const [contentReady, setContentReady] = useState(false);
  const gatesRef = useRef({ show: false, innerLayout: false });
  const rafRef = useRef<number | undefined>(undefined);
  const visibleRef = useRef(visible);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const cancelRevealRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
  }, []);

  const scheduleReveal = useCallback(() => {
    if (!visibleRef.current || !gatesRef.current.show || !gatesRef.current.innerLayout) {
      return;
    }
    cancelRevealRaf();
    rafRef.current = requestAnimationFrame(() => {
      if (visibleRef.current) {
        setContentReady(true);
      }
    });
  }, [cancelRevealRaf]);

  useLayoutEffect(() => {
    gatesRef.current = { show: false, innerLayout: false };
    setContentReady(false);
    cancelRevealRaf();
    return cancelRevealRaf;
  }, [visible, cancelRevealRaf]);

  const handleModalShow = useCallback(() => {
    gatesRef.current.show = true;
    scheduleReveal();
  }, [scheduleReveal]);

  const handleInnerLayout = useCallback(() => {
    gatesRef.current.innerLayout = true;
    scheduleReveal();
  }, [scheduleReveal]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={preferReducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      onShow={handleModalShow}
    >
      <View style={modalStyles.overlay}>
        {/* 배경 터치 영역 */}
        <Pressable style={modalStyles.backdrop} onPress={onClose} />

        {/* 모달 컨테이너 */}
        <View
          style={[
            modalStyles.container,
            !contentReady && baseModalStyles.containerHidden,
          ]}
          collapsable={false}
        >
          {/* 모달 내용 영역 */}
          <View
            collapsable={false}
            style={baseModalStyles.innerStack}
            onLayout={handleInnerLayout}
          >
            {/* 모달 제목 */}
            <Text style={modalStyles.title}>{title}</Text>
            {/* 모달 내용(children) */}
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const baseModalStyles = StyleSheet.create({
  containerHidden: {
    opacity: 0,
  },
  innerStack: {
    gap: 12,
  },
});

export default BaseModal;
