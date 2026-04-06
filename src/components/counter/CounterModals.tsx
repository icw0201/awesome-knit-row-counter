// src/components/counter/CounterModals.tsx
import React from 'react';
import { ConfirmModal, CounterEditModal } from '@components/common/modals';
import SubCounterRuleModal from './SubCounterRuleModal';

interface CounterModalsProps {
  activeModal: 'reset' | 'edit' | 'limit' | 'rule' | 'subReset' | 'subEdit' | 'subLimit' | 'targetCount' | 'timerReset' | null;
  errorModalVisible: boolean;
  errorMessage: string;
  voicePermissionModalVisible: boolean;
  voicePermissionModalTitle: string;
  voicePermissionModalDescription: string;
  voicePermissionModalConfirmText: string;
  voicePermissionModalCancelText: string;
  voiceMicPrimerModalVisible: boolean;
  onVoiceMicPrimerModalClose: () => void;
  onVoiceMicPrimerModalConfirm: () => void;
  currentCount: string;
  currentTargetCount: string;
  subCount: number;
  subRule: number;
  subRuleIsActive: boolean;
  onClose: () => void;
  onEditConfirm: (value: string) => void;
  onResetConfirm: () => void;
  onTimerResetConfirm: () => void;
  onErrorModalClose: () => void;
  onVoicePermissionModalClose: () => void;
  onVoicePermissionModalConfirm: () => void;
  onTargetCountConfirm: (value: string) => void;
  onSubEditConfirm: (value: string) => void;
  onSubResetConfirm: () => void;
  onSubRuleConfirm: (rule: number, isActive: boolean) => void;
}

/**
 * 카운터 모달들을 묶은 컴포넌트
 * 초기화, 편집, 범위 초과, 에러 모달을 관리합니다.
 */
const CounterModals: React.FC<CounterModalsProps> = ({
  activeModal,
  errorModalVisible,
  errorMessage,
  voicePermissionModalVisible,
  voicePermissionModalTitle,
  voicePermissionModalDescription,
  voicePermissionModalConfirmText,
  voicePermissionModalCancelText,
  voiceMicPrimerModalVisible,
  onVoiceMicPrimerModalClose,
  onVoiceMicPrimerModalConfirm,
  currentCount,
  currentTargetCount,
  subCount,
  subRule,
  subRuleIsActive,
  onClose,
  onEditConfirm,
  onResetConfirm,
  onTimerResetConfirm,
  onErrorModalClose,
  onVoicePermissionModalClose,
  onVoicePermissionModalConfirm,
  onTargetCountConfirm,
  onSubEditConfirm,
  onSubResetConfirm,
  onSubRuleConfirm,
}) => {
  return (
    <>
      {/* 초기화 확인 모달 */}
      <ConfirmModal
        visible={activeModal === 'reset'}
        onClose={onClose}
        title="숫자 초기화"
        description="숫자를 0으로 초기화하시겠습니까?"
        onConfirm={onResetConfirm}
        confirmText="초기화"
        cancelText="취소"
      />

      {/* 카운트 편집 모달 */}
      <CounterEditModal
        visible={activeModal === 'edit'}
        onClose={onClose}
        onConfirm={onEditConfirm}
        initialValue={currentCount}
        title="카운트 편집"
      />

      {/* 목표 단수 설정 모달 */}
      <CounterEditModal
        visible={activeModal === 'targetCount'}
        onClose={onClose}
        onConfirm={onTargetCountConfirm}
        initialValue={currentTargetCount}
        title="목표 단수 설정 (0 입력 시 목표 없음)"
      />

      {/* 타이머 초기화 확인 모달 */}
      <ConfirmModal
        visible={activeModal === 'timerReset'}
        onClose={onClose}
        title="타이머 초기화"
        description="정말 타이머를 초기화하시겠습니까? 초기화 후에는 복구가 불가능합니다."
        cancelText="취소"
        confirmText="확인"
        onConfirm={onTimerResetConfirm}
      />

      {/* 범위 초과 경고 모달 */}
      <ConfirmModal
        visible={activeModal === 'limit'}
        onClose={onClose}
        title="범위 초과 안내"
        description="본 카운터에는 0에서 9999 사이의 값만 입력할 수 있습니다."
        onConfirm={onClose}
        confirmText="확인"
        cancelText=""
      />

      {/* 보조 카운터 초기화 확인 모달 */}
      <ConfirmModal
        visible={activeModal === 'subReset'}
        onClose={onClose}
        title="보조 카운터 초기화"
        description="보조 카운터를 0으로 초기화하시겠습니까?"
        onConfirm={onSubResetConfirm}
        confirmText="초기화"
        cancelText="취소"
      />

      {/* 보조 카운터 편집 모달 */}
      <CounterEditModal
        visible={activeModal === 'subEdit'}
        onClose={onClose}
        onConfirm={onSubEditConfirm}
        initialValue={subCount.toString()}
        title="보조 카운터 편집"
      />

      {/* 보조 카운터 범위 초과 경고 모달 */}
      <ConfirmModal
        visible={activeModal === 'subLimit'}
        onClose={onClose}
        title="보조 카운터 범위 초과 안내"
        description="보조 카운터에는 0에서 9999 사이의 값만 입력할 수 있습니다."
        onConfirm={onClose}
        confirmText="확인"
        cancelText=""
      />

      {/* 보조 카운터 규칙 모달 */}
      <SubCounterRuleModal
        visible={activeModal === 'rule'}
        onClose={onClose}
        onConfirm={onSubRuleConfirm}
        initialRule={subRule}
        initialIsRuleActive={subRuleIsActive}
      />

      {/* 에러 모달 */}
      <ConfirmModal
        visible={errorModalVisible}
        onClose={onErrorModalClose}
        title="오류"
        description={errorMessage}
        onConfirm={onErrorModalClose}
        confirmText="확인"
        cancelText=""
      />

      {/* OS 마이크 권한 요청 직전 선택적 접근 안내 */}
      <ConfirmModal
        visible={voiceMicPrimerModalVisible}
        onClose={onVoiceMicPrimerModalClose}
        title="선택적 접근 권한"
        description={
          '마이크 : 음성 인식 단수 증감 기능을 위해 접근이 필요합니다.\n\n음성 인식 단수 증감 기능을 위해 다음 권한을 허용해 주시기 바랍니다.'
        }
        onConfirm={onVoiceMicPrimerModalConfirm}
        confirmText="확인"
        cancelText=""
      />

      {/* 음성 인식 권한/사용 불가 안내 모달 */}
      <ConfirmModal
        visible={voicePermissionModalVisible}
        onClose={onVoicePermissionModalClose}
        title={voicePermissionModalTitle}
        description={voicePermissionModalDescription}
        onConfirm={onVoicePermissionModalConfirm}
        confirmText={voicePermissionModalConfirmText}
        cancelText={voicePermissionModalCancelText}
      />
    </>
  );
};

export default CounterModals;
