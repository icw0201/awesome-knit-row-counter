import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';

import CheckBox from '@components/common/CheckBox';
import ActivateToggle from '@components/common/ActivateToggle';
import QuestionMarkTooltip from '@components/counter/QuestionMarkTooltip';
import RuleCard from '@components/counter/RuleCard';
import { ConfirmModal } from '@components/common/modals';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';
import { colorStyles } from '@styles/colorStyles';
import { RepeatRule } from '@storage/types';
import { getDefaultColorForNewRule } from '@utils/ruleUtils';
import { useWaySetting, type RuleConfirmData } from '@hooks/useWaySetting';

// 상수 정의
const KEYBOARD_VERTICAL_OFFSET = 80; // 키보드가 나타날 때 수직 오프셋

/**
 * 새 규칙 추가 카드 컴포넌트 Props 타입
 */
type NewRuleCardProps = {
  repeatRules: RepeatRule[];
  onConfirm: (data: RuleConfirmData) => void;
  onCancel: () => void;
};

/**
 * 새 규칙 추가 카드 컴포넌트 (메모이제이션)
 */
const NewRuleCard = React.memo<NewRuleCardProps>(({ repeatRules, onConfirm, onCancel }) => {
  const defaultColor = useMemo(() => getDefaultColorForNewRule(repeatRules), [repeatRules]);

  return (
    <RuleCard
      message=""
      startNumber={0}
      endNumber={0}
      repeatCount={0}
      endMode={null}
      ruleNumber={0}
      color={defaultColor}
      isEditable={true}
      onConfirm={onConfirm}
      onDelete={onCancel}
    />
  );
});

NewRuleCard.displayName = 'NewRuleCard';

/**
 * Way 설정 화면 컴포넌트
 * 어쩜이 활성화, 앞뒤 변경 여부, 신규 규칙 추가 및 편집을 하는 화면
 */
const WaySetting = () => {
  const {
    mascotIsActive,
    wayIsChange,
    repeatRules,
    isAddingNewRule,
    showDeleteModal,
    deleteRuleMessage,
    handleToggleMascotIsActive,
    handleToggleWayIsChange,
    handleAddRule,
    handleRuleConfirm,
    handleRuleDeleteClick,
    handleRuleDeleteConfirm,
    handleCloseDeleteModal,
    handleCancelAddRule,
  } = useWaySetting();

  return (
    <SafeAreaView style={screenStyles.flex1} edges={safeAreaEdges}>
      <KeyboardAvoidingView
        style={screenStyles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET}
      >
        <ScrollView
          contentContainerStyle={screenStyles.scrollViewContentCentered}
          keyboardShouldPersistTaps="handled"
        >
        {/* 활성화 토글 */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-base text-black">활성화</Text>
          <ActivateToggle
            mascotIsActive={mascotIsActive}
            onToggle={handleToggleMascotIsActive}
          />
        </View>

        {/* 단마다 앞/뒤 방향 표시하기 체크박스 */}
        <View className="mb-6">
          <CheckBox
            label="단마다 앞/뒤 방향 표시하기"
            checked={wayIsChange}
            onToggle={handleToggleWayIsChange}
          >
            <QuestionMarkTooltip tooltipText="어쩌미가 단마다 앞/뒤, 도안 읽는 방향을 표시해줍니다." />
          </CheckBox>
        </View>

        {/* 규칙 카드들 */}
        {repeatRules.map((rule: RepeatRule, index: number) => {
          // 규칙의 모든 속성을 조합하여 안정적인 key 생성
          // 순서가 바뀌지 않으므로 index 없이 속성만으로 key 생성 가능
          const ruleKey = `rule-${rule.message}-${rule.startNumber}-${rule.endNumber}-${rule.repeatCount ?? 0}-${rule.endMode ?? 'none'}-${rule.ruleNumber}-${rule.color ?? 'default'}`;
          return (
            <RuleCard
              key={ruleKey}
              message={rule.message}
              startNumber={rule.startNumber}
              endNumber={rule.endNumber}
              repeatCount={rule.repeatCount ?? 0}
              endMode={rule.endMode}
              ruleNumber={rule.ruleNumber}
              color={rule.color}
              isEditable={false}
              onConfirm={(data) => handleRuleConfirm(index, data)}
              onDelete={() => handleRuleDeleteClick(index)}
            />
          );
        })}

        {/* 새 규칙 추가 카드 */}
        {isAddingNewRule && (
          <NewRuleCard
            repeatRules={repeatRules}
            onConfirm={(data) => handleRuleConfirm(null, data)}
            onCancel={handleCancelAddRule}
          />
        )}

        {/* 규칙 추가 버튼 */}
        {!isAddingNewRule && (
          <View className="w-full items-center mb-6">
            <View className="relative">
              <TouchableOpacity
                className={`${colorStyles.lightest.container} rounded-xl pl-5 pr-4 py-2 flex-row items-center`}
                onPress={handleAddRule}
              >
                <Text className={`text-base ${colorStyles.lightest.icon} mr-2`}>규칙 추가</Text>
                <Plus size={22} color={colorStyles.lightest.icon} strokeWidth={2.5} />
              </TouchableOpacity>
              <View className="absolute -right-8 top-4 -mt-3">
                <QuestionMarkTooltip tooltipText="몇 단마다 규칙(꽈배기나 늘림 등)이 있을 때 이 기능을 활용해 보세요!" />
              </View>
            </View>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 규칙 삭제 확인 모달 */}
      <ConfirmModal
        visible={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title="규칙 삭제"
        description={`"${deleteRuleMessage}" 규칙을 정말 삭제하시겠습니까?`}
        onConfirm={handleRuleDeleteConfirm}
        confirmText="삭제"
        cancelText="취소"
      />
    </SafeAreaView>
  );
};

export default WaySetting;
