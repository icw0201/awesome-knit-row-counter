import React, { useState, useEffect, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { View, Text, type TextLayoutEventData } from 'react-native';
import ColorCompleteIcon from '@assets/images/color_complete.svg';
import CircleIcon from '@components/common/CircleIcon';
import TextInputBox, { TextInputBoxRef } from '@components/common/TextInputBox';
import ColorPicker from '@components/counter/ColorPicker';
import { calculateRulePreview, calculateRuleRepeatCount } from '@utils/ruleUtils';
import { numberToString } from '@utils/numberUtils';

interface RuleCardProps {
  message: string;
  startNumber: number;
  endNumber: number;
  repeatCount: number;
  ruleNumber: number;
  color: string; // 색상 (hex 값, 예: '#fc3e39', 필수)
  onDelete?: () => void;
  onConfirm?: (data: { message: string; startNumber: number; endNumber: number; repeatCount: number; ruleNumber: number; color: string }) => void;
  isEditable?: boolean; // 편집 가능 여부
}

const MESSAGE_ICON_SIZE = 24;
const MESSAGE_ICON_GAP = 6;

type MessageLastLine = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * 텍스트 레이아웃 변경 핸들러 (마지막 줄 좌표 추출)
 * 텍스트가 렌더링될 때 마지막 줄의 위치 정보를 추출하여 아이콘 배치에 사용
 */
const createTextLayoutHandler = (
  setMessageLastLine: React.Dispatch<React.SetStateAction<MessageLastLine | null>>
) => {
  return (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = e.nativeEvent.lines;
    if (!lines || lines.length === 0) {
      return;
    }
    const last = lines[lines.length - 1];
    const next: MessageLastLine = { x: last.x, y: last.y, width: last.width, height: last.height };
    setMessageLastLine((prev) => {
      // 이전 값과 동일하면 업데이트하지 않음 (불필요한 리렌더링 방지)
      if (
        prev &&
        prev.x === next.x &&
        prev.y === next.y &&
        prev.width === next.width &&
        prev.height === next.height
      ) {
        return prev;
      }
      return next;
    });
  };
};

/**
 * 아이콘의 left 위치 계산
 * 텍스트 마지막 줄의 끝 위치에 간격을 더하여 아이콘을 배치
 */
const calculateIconLeft = (messageLastLine: MessageLastLine): number => {
  return messageLastLine.x + messageLastLine.width + MESSAGE_ICON_GAP;
};

/**
 * 아이콘의 top 위치 계산
 * 텍스트 마지막 줄의 수직 중앙에 아이콘을 배치
 */
const calculateIconTop = (messageLastLine: MessageLastLine): number => {
  return messageLastLine.y + (messageLastLine.height - MESSAGE_ICON_SIZE) / 2;
};

/**
 * 규칙 유효성 검사 함수 타입 정의
 */
type ValidateRuleFunction = (
  trimmedMessage: string,
  start: string | number,
  end: string | number,
  rule: string | number,
  repeatCount: string | number
) => { error: string | null; start: number; end: number; rule: number; repeatCount: number };

/**
 * 규칙 미리보기 렌더링
 * 편집 중인 규칙의 유효성을 검사하고, 적용될 단수를 미리보기로 표시
 */
const renderRulePreview = (
  editMessage: string,
  editStartNumber: string,
  editEndNumber: string,
  editRuleNumber: string,
  editRepeatCount: string,
  validateRule: ValidateRuleFunction
) => {
  const { error: ruleError, start, end, rule, repeatCount } = validateRule(
    editMessage.trim(),
    editStartNumber,
    editEndNumber,
    editRuleNumber,
    editRepeatCount
  );
  const hasRuleInput = (start > 0 || end > 0 || repeatCount > 0) && rule > 0;
  const rulePreview = hasRuleInput ? calculateRulePreview(start, end, rule, 5, repeatCount) : [];
  const totalRepeatCount = hasRuleInput ? calculateRuleRepeatCount(start, end, rule, repeatCount) : null;

  if (!hasRuleInput && !ruleError) {
    return null;
  }

  const previewText =
    hasRuleInput && rulePreview.length > 0
      ? rulePreview.map((n) => `${n}단`).join(', ')
      : '';
  const hasMorePreviewItems =
    totalRepeatCount !== null ? totalRepeatCount > rulePreview.length : rulePreview.length === 5;
  const previewSuffix = hasRuleInput
    ? totalRepeatCount !== null
      ? ` (${totalRepeatCount}회)`
      : ' (∞)'
    : '';

  return (
    <View className="mt-2 flex-row items-center">
      <Text className="text-base font-extrabold text-black mr-2">적용 단 :</Text>
      <View className="flex-1">
        {ruleError ? (
          <Text className="text-sm text-red-orange-500">{ruleError}</Text>
        ) : (
          previewText && (
            <Text className="text-sm text-darkgray">
              {previewText}
              {hasMorePreviewItems ? '...' : ''}
              {previewSuffix}
            </Text>
          )
        )}
      </View>
    </View>
  );
};

/**
 * 규칙 카드 컴포넌트
 * 줄임단/늘림단 규칙을 표시하고 편집할 수 있는 카드
 */
const RuleCard: React.FC<RuleCardProps> = ({
  message,
  startNumber,
  endNumber,
  repeatCount,
  ruleNumber,
  color,
  onDelete,
  onConfirm,
  isEditable = false,
}) => {
  const [isEditMode, setIsEditMode] = useState(isEditable);
  const [editMessage, setEditMessage] = useState(message);
  const [editStartNumber, setEditStartNumber] = useState(numberToString(startNumber));
  const [editEndNumber, setEditEndNumber] = useState(numberToString(endNumber));
  const [editRepeatCount, setEditRepeatCount] = useState(numberToString(repeatCount));
  const [editRuleNumber, setEditRuleNumber] = useState(numberToString(ruleNumber));
  const [editColor, setEditColor] = useState(color);
  const [messageLastLine, setMessageLastLine] = useState<MessageLastLine | null>(null);

  // TextInputBox refs
  const messageInputRef = useRef<TextInputBoxRef>(null);
  const startNumberInputRef = useRef<TextInputBoxRef>(null);
  const endNumberInputRef = useRef<TextInputBoxRef>(null);
  const ruleNumberInputRef = useRef<TextInputBoxRef>(null);
  const repeatCountInputRef = useRef<TextInputBoxRef>(null);

  // props가 변경되면 내부 state도 업데이트
  useEffect(() => {
    setEditMessage(message);
    setEditStartNumber(numberToString(startNumber));
    setEditEndNumber(numberToString(endNumber));
    setEditRepeatCount(numberToString(repeatCount));
    setEditRuleNumber(numberToString(ruleNumber));
    setEditColor(color);
  }, [message, startNumber, endNumber, repeatCount, ruleNumber, color]);

  // 보기 모드 메시지가 바뀌면 마지막 줄 좌표도 초기화
  useEffect(() => {
    setMessageLastLine(null);
  }, [message]);

  const viewRepeatCount = calculateRuleRepeatCount(startNumber, endNumber, ruleNumber, repeatCount);
  const viewRepeatCountText = viewRepeatCount !== null ? ` (${viewRepeatCount}회)` : ' (∞)';

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleConfirm = () => {
    const result = validateRule(
      editMessage.trim(),
      editStartNumber,
      editEndNumber,
      editRuleNumber,
      editRepeatCount
    );
    if (result.error) {
      return;
    }
    setIsEditMode(false);
    onConfirm?.({
      message: editMessage.trim(),
      startNumber: result.start,
      endNumber: result.end,
      repeatCount: result.repeatCount,
      ruleNumber: result.rule,
      color: editColor,
    });
  };

  const handleColorSelect = (selectedColor: string) => {
    setEditColor(selectedColor);
  };

  const handleDelete = () => {
    // 편집 모드는 유지하고 삭제 확인만 수행
    onDelete?.();
  };

  /** 유효성 검사 + 파싱 (문자열/숫자 모두 받음) */
  const validateRule = (
    trimmedMessage: string,
    start: string | number,
    end: string | number,
    rule: string | number,
    repeatCountValue: string | number
  ): { error: string | null; start: number; end: number; rule: number; repeatCount: number } => {
    const parsedStart = typeof start === 'string' ? parseInt(start, 10) || 0 : start;
    const parsedEnd = typeof end === 'string' ? parseInt(end, 10) || 0 : end;
    const parsedRule = typeof rule === 'string' ? parseInt(rule, 10) || 0 : rule;
    const parsedRepeatCount =
      typeof repeatCountValue === 'string' ? parseInt(repeatCountValue, 10) || 0 : repeatCountValue;
    const parsed = { start: parsedStart, end: parsedEnd, rule: parsedRule, repeatCount: parsedRepeatCount };

    if (!trimmedMessage) {
      return { ...parsed, error: '메시지를 입력해 주세요.' };
    }
    if (parsedEnd > 0 && parsedRepeatCount > 0) {
      return { ...parsed, error: '종료단과 반복 횟수는 동시에 설정할 수 없습니다.' };
    }
    if (parsedStart === 0 && parsedEnd === 0 && parsedRepeatCount === 0) {
      return { ...parsed, error: '시작단, 종료단 혹은 반복 횟수를 설정해 주세요.' };
    }
    if (parsedRule === 0) {
      return { ...parsed, error: '반복 규칙을 설정해 주세요.' };
    }
    if (parsedStart > 0 && parsedEnd > 0 && parsedStart > parsedEnd) {
      return { ...parsed, error: '시작단이 종료단보다 클 수 없습니다.' };
    }
    return { ...parsed, error: null };
  };


  // 보기 모드
  if (!isEditMode) {
    return (
      <View className="mb-4 bg-white border border-lightgray rounded-xl p-4">
        <View className="flex-row items-center">
          <View className="flex-1 min-w-0">
            <View className="mb-2 min-w-0 relative">
              <Text
                className="text-base font-extrabold text-black flex-shrink"
                style={{ paddingRight: MESSAGE_ICON_SIZE + MESSAGE_ICON_GAP }}
                onTextLayout={createTextLayoutHandler(setMessageLastLine)}
              >
                {message}
              </Text>
              {messageLastLine && (
                <View
                  className="absolute"
                  style={{
                    left: calculateIconLeft(messageLastLine),
                    top: calculateIconTop(messageLastLine),
                  }}
                >
                  <ColorCompleteIcon
                    width={MESSAGE_ICON_SIZE}
                    height={MESSAGE_ICON_SIZE}
                    color={color}
                  />
                </View>
              )}
            </View>
            <Text className="text-base text-black">
              {startNumber > 0 ? `${startNumber}단부터 ` : ''}
              {endNumber > 0 ? `${endNumber}단까지 ` : ''}
              {ruleNumber}단마다
              {viewRepeatCountText}
            </Text>
          </View>
          <View className="flex-shrink-0 ml-2">
            <CircleIcon
              size={44}
              iconName="pencil"
              colorStyle="medium"
              isButton
              onPress={handleEditClick}
            />
          </View>
        </View>
      </View>
    );
  }

  // 편집 모드 (늘림단 카드 또는 줄임단 카드 편집 상태)
  return (
    <View className="mb-4 bg-red-orange-50 border border-lightgray rounded-xl p-4">
      {/* 메시지 섹션 */}
      <View className="mb-3 flex-row items-center">
        <Text className="text-base font-extrabold text-black mr-2">메시지 :</Text>
        <View className="flex-1 flex-row items-center">
          <View className="flex-1">
            <TextInputBox
              ref={messageInputRef}
              label=""
              value={editMessage}
              onChangeText={setEditMessage}
              type="text"
              containerClassName="mt-1"
              returnKeyType="next"
              onSubmitEditing={() => startNumberInputRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <View className="ml-2">
            <ColorPicker
              selectedColor={editColor}
              onSelect={handleColorSelect}
            />
          </View>
        </View>
      </View>

      {/* 규칙 섹션 */}
      <View className="mb-0">
        {/* 시작단부터 종료단까지 */}
        <View className="flex-row items-center mb-0">
          <Text className="text-base font-extrabold text-black mr-2">규칙 :</Text>
          <View className="mr-2 w-18">
            <TextInputBox
              ref={startNumberInputRef}
              label=""
              value={editStartNumber}
              onChangeText={setEditStartNumber}
              type="number"
              containerClassName="mb-2"
              returnKeyType="next"
              onSubmitEditing={() => endNumberInputRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <Text className="text-base text-black mr-2">단부터</Text>
          <View className="mr-2 w-18">
            <TextInputBox
              ref={endNumberInputRef}
              label=""
              value={editEndNumber}
              onChangeText={setEditEndNumber}
              type="number"
              containerClassName="mb-2"
              returnKeyType="next"
              onSubmitEditing={() => ruleNumberInputRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <Text className="text-base text-black">단까지</Text>
        </View>
        {/* 단마다 반복 규칙 */}
        <View className="flex-row items-start mb-0">
          {/* 정렬을 위한 투명한 "규칙 :" 텍스트 */}
          <Text className="text-base font-extrabold text-black mr-2 opacity-0">규칙 :</Text>
          <View className="flex-1 min-w-0 flex-row flex-wrap items-start">
            <View className="mr-2 w-18">
              <TextInputBox
                ref={ruleNumberInputRef}
                label=""
                value={editRuleNumber}
                onChangeText={setEditRuleNumber}
                type="number"
                containerClassName="mb-0"
                returnKeyType="next"
                onSubmitEditing={() => repeatCountInputRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
            <Text className="self-center text-base text-black mr-2">단마다 반복 규칙</Text>
            <View className="flex-row items-center flex-shrink-0">
              <Text className="text-base text-black mr-2">(</Text>
              <View className="mr-2 w-18">
                <TextInputBox
                  ref={repeatCountInputRef}
                  label=""
                  value={editRepeatCount}
                  onChangeText={setEditRepeatCount}
                  type="number"
                  containerClassName="mb-0"
                  returnKeyType="done"
                  onSubmitEditing={() => repeatCountInputRef.current?.blur()}
                  blurOnSubmit={true}
                />
              </View>
              <Text className="text-base text-black">회 반복)</Text>
            </View>
          </View>
        </View>

        {/* 규칙 미리보기 / 에러 표시 */}
        {renderRulePreview(editMessage, editStartNumber, editEndNumber, editRuleNumber, editRepeatCount, validateRule)}
      </View>

      {/* 삭제/확인 버튼 */}
      <View className="flex-row items-center justify-end mt-1">
        <CircleIcon
          size={44}
          isButton={true}
          iconName="trash-2"
          colorStyle="medium"
          containerClassName="mr-2"
          onPress={handleDelete}
        />
        <CircleIcon
          size={44}
          isButton={true}
          iconName="check"
          colorStyle="medium"
          onPress={handleConfirm}
        />
      </View>
    </View>
  );
};

export default RuleCard;

