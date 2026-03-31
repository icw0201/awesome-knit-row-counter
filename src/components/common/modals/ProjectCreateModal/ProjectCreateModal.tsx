// src/components/common/modals/ProjectCreateModal/ProjectCreateModal.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { BaseModal } from '../BaseModal';
import TextInputBox from '@components/common/TextInputBox';
import CheckRadioButtons, { type CheckRadioOption } from '@components/common/CheckRadioButtons';
import RoundedButton from '@components/common/RoundedButton';

/**
 * ProjectCreateModal 컴포넌트의 Props 인터페이스
 * @param visible - 모달 표시 여부
 * @param onClose - 모달 닫기 콜백 함수
 * @param onConfirm - 생성 확인 시 콜백 함수
 */
interface ProjectCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string, type: 'project' | 'counter') => void;
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

  const handleConfirm = () => {
    if (textValue.trim()) {
      onConfirm(textValue.trim(), selectedType);
      setTextValue('');
      setSelectedType('counter');
      onClose();
    }
  };

  const handleClose = () => {
    setTextValue('');
    setSelectedType('counter');
    onClose();
  };

  const radioOptions: CheckRadioOption[] = [
    {
      label: '프로젝트',
      value: 'project',
      tooltip: '프로젝트는 하위에 여러 카운터를 생성할 수 있습니다.',
    },
    {
      label: '카운터',
      value: 'counter',
      tooltip: '단일 카운터를 생성합니다.',
    },
  ];

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title={title}
    >
      {/* 체크형 라디오 버튼 목록 */}
      <View className="mt-4 mb-0">
        <CheckRadioButtons
          selected={selectedType}
          onSelect={(value) => setSelectedType(value as 'project' | 'counter')}
          options={radioOptions}
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
