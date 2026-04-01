// src/components/common/modals/BaseModal/BaseModal.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  /** 네이티브 onShow + 제목·children이 포함된 영역 레이아웃 완료 후에만 표시 */
  const gatesRef = useRef({ show: false, innerLayout: false });
  const rafRef = useRef<{ a?: number; b?: number }>({});
  const visibleRef = useRef(visible);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const clearRevealRaf = useCallback(() => {
    if (rafRef.current.a != null) {
      cancelAnimationFrame(rafRef.current.a);
    }
    if (rafRef.current.b != null) {
      cancelAnimationFrame(rafRef.current.b);
    }
    rafRef.current = {};
  }, []);

  const scheduleReveal = useCallback(() => {
    if (!visibleRef.current) {
      return;
    }
    if (!gatesRef.current.show || !gatesRef.current.innerLayout) {
      return;
    }
    clearRevealRaf();
    rafRef.current.a = requestAnimationFrame(() => {
      rafRef.current.b = requestAnimationFrame(() => {
        if (visibleRef.current) {
          setContentReady(true);
        }
      });
    });
  }, [clearRevealRaf]);

  useEffect(() => {
    gatesRef.current = { show: false, innerLayout: false };
    setContentReady(false);
    clearRevealRaf();
  }, [visible, clearRevealRaf]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const fallbackMs = 500;
    const t = setTimeout(() => {
      if (!visibleRef.current) {
        return;
      }
      setContentReady((prev) => (prev ? prev : true));
    }, fallbackMs);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(
    () => () => {
      clearRevealRaf();
    },
    [clearRevealRaf],
  );

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

        {/* 모달 컨테이너 — 네이티브 표시·카드 레이아웃·자식 측정이 끝날 때까지 숨김 */}
        <View
          style={[
            modalStyles.container,
            !contentReady && baseModalStyles.containerHidden,
          ]}
          collapsable={false}
        >
          <View
            collapsable={false}
            style={baseModalStyles.innerStack}
            onLayout={handleInnerLayout}
          >
            {/* 모달 제목 */}
            <Text style={modalStyles.title}>{title}</Text>

            {/* 모달 내용 */}
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
  /** modalStyles.container의 gap과 동일 — 내부 래퍼가 자식이 되면서 밖의 gap이 적용되지 않음 */
  innerStack: {
    gap: 12,
  },
});

export default BaseModal;
