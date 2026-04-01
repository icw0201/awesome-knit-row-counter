// src/components/common/modals/ProjectCreateModal/ProjectCreateModal.tsx
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { BaseModal } from '../BaseModal';
import TextInputBox from '@components/common/TextInputBox';
import RoundedButton from '@components/common/RoundedButton';
import ProjectTypeSelector from './ProjectTypeSelector';

/**
 * ProjectCreateModal 컴포넌트의 Props 인터페이스
 * @param visible - 모달 표시 여부
 * @param onClose - 모달 닫기 콜백 함수
 * @param onConfirm - 생성 확인 시 콜백. `false`를 반환하면 모달을 닫지 않음(예: 중복 확인 모달 위에 유지)
 */
interface ProjectCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string, type: 'project' | 'counter') => boolean | void;
  title?: string;
}

/**
 * 프로젝트/카운터 생성 모달 컴포넌트
 * 프로젝트 또는 카운터를 생성할 때 사용하는 모달입니다.
 */
const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = '새 프로젝트 생성하기',
}) => {
  const [textValue, setTextValue] = useState('');
  const [selectedType, setSelectedType] = useState<'project' | 'counter'>('counter');

  useEffect(() => {
    if (!visible) {
      setTextValue('');
      setSelectedType('counter');
    }
  }, [visible]);

  const handleConfirm = () => {
    if (textValue.trim()) {
      const keepOpen = onConfirm(textValue.trim(), selectedType) === false;
      if (!keepOpen) {
        setTextValue('');
        setSelectedType('counter');
        onClose();
      }
    }
  };

  const handleClose = () => {
    setTextValue('');
    setSelectedType('counter');
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title={title}
    >
      {/* 체크형 라디오 버튼 목록 */}
      <View className="mt-4 mb-0">
        <ProjectTypeSelector
          selected={selectedType}
          onSelect={setSelectedType}
        />
      </View>

      {/* 입력 필드 섹션 */}
      <TextInputBox
        label=""
        value={textValue}
        onChangeText={setTextValue}
        placeholder="프로젝트 이름을 입력하세요"
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
        {/* 생성 버튼 - 입력값이 있을 때만 활성화 */}
        <RoundedButton
          title="생성"
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

export default ProjectCreateModal;
