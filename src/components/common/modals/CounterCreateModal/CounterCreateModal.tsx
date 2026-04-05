// src/components/common/modals/CounterCreateModal/CounterCreateModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { BaseModal } from '../BaseModal';
import TextInputBox from '@components/common/TextInputBox';
import RoundedButton from '@components/common/RoundedButton';

/**
 * CounterCreateModal 컴포넌트의 Props 인터페이스
 * @param visible - 모달 표시 여부
 * @param onClose - 모달 닫기 콜백 함수
 * @param onConfirm - 생성 확인 시 콜백. `false`를 반환하면 모달을 닫지 않음(예: 중복 확인 모달 위에 유지)
 * @param title - 모달 제목 (기본값: '새 카운터 생성하기')
 * @param initialName - 모달이 열릴 때 입력창 초기값 (복제 모달 등)
 * @param confirmButtonTitle - 확인 버튼 라벨 (기본값: '생성')
 * @param placeholder - 입력창 플레이스홀더
 */
interface CounterCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string) => boolean | void;
  title?: string;
  initialName?: string;
  confirmButtonTitle?: string;
  placeholder?: string;
}

/**
 * 카운터 생성 모달 컴포넌트
 * 카운터만 생성할 때 사용하는 모달입니다. (라디오 버튼 없음)
 */
const CounterCreateModal: React.FC<CounterCreateModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = '새 카운터 생성하기',
  initialName,
  confirmButtonTitle = '생성',
  placeholder = '카운터 이름을 입력하세요',
}) => {
  const [textValue, setTextValue] = useState('');
  /** 직전 프레임에 visible 이었는지 — false→true 일 때만 initialName 으로 시드(열려 있는 동안 initialName 변경 시 입력 유지) */
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setTextValue('');
      wasVisibleRef.current = false;
      return;
    }
    if (!wasVisibleRef.current) {
      setTextValue(initialName ?? '');
    }
    wasVisibleRef.current = true;
  }, [visible, initialName]);

  const handleConfirm = () => {
    if (textValue.trim()) {
      const keepOpen = onConfirm(textValue.trim()) === false;
      if (!keepOpen) {
        setTextValue('');
        onClose();
      }
    }
  };

  const handleClose = () => {
    setTextValue('');
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title={title}
    >
      {/* 입력 필드 섹션 */}
      <TextInputBox
        label=""
        value={textValue}
        onChangeText={setTextValue}
        placeholder={placeholder}
        type="text"
      />

      {/* 버튼 섹션 - 버튼 타입에 따라 다른 버튼 조합 표시 */}
      <View className="flex-row justify-evenly">
        {/* 취소 버튼 */}
        <RoundedButton
          title="취소"
          onPress={handleClose}
          colorStyle="light"
        />
        <RoundedButton
          title={confirmButtonTitle}
          onPress={() => {
            if (textValue?.trim()) {
              handleConfirm();
            }
          }}
          colorStyle={textValue?.trim() ? 'vivid' : undefined}
          containerClassName={!textValue?.trim() ? 'bg-lightgray' : undefined}
        />
      </View>
    </BaseModal>
  );
};

export default CounterCreateModal;
