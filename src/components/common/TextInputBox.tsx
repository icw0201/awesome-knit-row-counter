// src/components/TextInputBox.tsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput as RNTextInput, Text, TextInputProps } from 'react-native';
import clsx from 'clsx';

// 상수 정의
const INPUT_LIMITS = {
  number: 4,
  text: 15,
  longText: 500,
} as const;

const DATE_MAX_LENGTH = 8;

/**
 * 텍스트 입력 필드의 타입 정의
 * - number: 숫자만 입력 가능 (최대 4자리)
 * - text: 일반 텍스트 입력 (최대 15자리)
 * - date: 날짜 형식 입력 (YYYY.MM.DD)
 * - longText: 긴 텍스트 입력 (최대 500자리, 여러 줄 지원)
 */
type TextInputType = 'number' | 'text' | 'date' | 'longText';

/**
 * TextInputBox 컴포넌트의 ref 인터페이스
 */
export interface TextInputBoxRef {
  focus: () => void;
  blur: () => void;
}

/**
 * TextInputBox 컴포넌트의 Props 인터페이스
 * @param label - 입력 필드 위에 표시될 라벨 텍스트
 * @param value - 입력 필드의 현재 값
 * @param onChangeText - 입력 값 변경 시 실행될 콜백 함수
 * @param placeholder - 입력 필드에 표시될 플레이스홀더 텍스트
 * @param type - 입력 필드의 타입 (TextInputType)
 * @param maxLength - 최대 입력 길이 (기본값: longText는 500, 나머지는 15)
 * @param containerClassName - 추가적인 컨테이너 스타일 클래스
 * @param required - 필수 필드 여부 (기본값: false)
 * @param returnKeyType - 키보드의 return 키 타입 (기본값: 'next')
 * @param onSubmitEditing - return 키를 눌렀을 때 실행될 콜백 함수
 * @param blurOnSubmit - return 키를 눌렀을 때 blur할지 여부 (기본값: false)
 */
interface TextInputBoxProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  type: TextInputType;
  maxLength?: number;
  containerClassName?: string;
  inputClassName?: string;
  required?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  blurOnSubmit?: boolean;
  editable?: boolean;
  showCounter?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  textAlign?: TextInputProps['textAlign'];
  fillWidth?: boolean;
}

/**
 * 텍스트 입력 필드 컴포넌트
 * 다양한 타입의 입력을 지원하며, 각 타입에 맞는 유효성 검사와 포맷팅을 제공합니다.
 * 포커스 상태에 따라 테두리 색상이 변경되고, 문자 수 카운터를 표시합니다.
 */
const TextInputBox = forwardRef<TextInputBoxRef, TextInputBoxProps>(({
  label,
  value,
  onChangeText,
  placeholder,
  type,
  maxLength = type === 'longText' ? INPUT_LIMITS.longText : INPUT_LIMITS.text,
  containerClassName = '',
  inputClassName = '',
  required = false,
  returnKeyType = 'done',
  onSubmitEditing,
  blurOnSubmit = false,
  editable = true,
  showCounter = type === 'longText' || type === 'text',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  textAlign,
  fillWidth = true,
}, ref) => {
  // 입력 필드의 포커스 상태 관리
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef<RNTextInput>(null);

  // ref를 통해 focus, blur 메서드 노출
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    },
  }));

  /**
   * 숫자 입력 처리 함수
   * @param text - 입력된 텍스트
   */
  const handleNumberInput = (text: string) => {
    if (!/^\d*$/.test(text) || text.length > INPUT_LIMITS.number) {
      return;
    }
    onChangeText?.(text);
  };

  /**
   * 날짜 입력 처리 함수
   * @param text - 입력된 텍스트
   */
  const handleDateInput = (text: string) => {
    const raw = text.replace(/\./g, '').slice(0, DATE_MAX_LENGTH);
    if (!/^\d*$/.test(raw)) {
      return;
    }

    let formatted = raw;
    if (raw.length > 4) {
      formatted = `${raw.slice(0, 4)}.${raw.slice(4)}`;
    }
    if (raw.length > 6) {
      formatted = `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6)}`;
    }

    onChangeText?.(formatted);
  };

  /**
   * 일반 텍스트 입력 처리 함수
   * @param text - 입력된 텍스트
   */
  const handleTextInput = (text: string) => {
    const limit = maxLength ?? (type === 'longText' ? INPUT_LIMITS.longText : INPUT_LIMITS.text);
    if (text.length > limit) {
      return;
    }
    onChangeText?.(text);
  };

  /**
   * 입력 텍스트 변경 시 처리하는 함수
   * 타입에 따라 다른 유효성 검사와 포맷팅을 적용합니다.
   * @param text - 입력된 텍스트
   */
  const handleChangeText = (text: string) => {
    switch (type) {
      case 'number':
        handleNumberInput(text);
        break;
      case 'date':
        handleDateInput(text);
        break;
      default:
        handleTextInput(text);
        break;
    }
  };

  // 입력 필드 스타일 클래스
  const inputFieldClass = clsx(
    'w-full px-3 border rounded-xl',
    type === 'longText' ? 'text-sm min-h-[54px]' : 'h-[54px]',
    editable ? 'bg-white text-black' : 'bg-lightgray text-darkgray',
    isFocused ? 'border-red-orange-400' : 'border-lightgray',
    inputClassName
  );

  // 문자 수 카운터 표시 여부
  const shouldShowCounter = showCounter;
  const currentLength = (value ?? '').length;
  const maxLengthForType = type === 'longText' ? INPUT_LIMITS.longText : maxLength;

  // NativeWind 환경에서 같은 속성(예: mb-*)이 한 번에 여러 개 섞일 때 override가
  // 기대대로 동작하지 않는 케이스가 있어, 기본값을 조건부로 넣어 충돌 자체를 피한다.
  const hasMbOverride = /\bmb-/.test(containerClassName);

  // label이 비어있을 때는 라벨 영역을 숨기고, 같은 행에 배치할 때 y축 중앙 정렬을 위해 입력 필드만 중앙 정렬
  const hasLabel = label.trim().length > 0;
  const shouldShowLabelArea = hasLabel || shouldShowCounter;

  return (
    <View className={clsx(fillWidth && 'w-full', !hasMbOverride && 'mb-4', !hasLabel && 'self-center', containerClassName)}>
      {/* 라벨과 문자 수 카운터를 표시하는 상단 영역 */}
      {shouldShowLabelArea && (
        <View className="pl-1 mb-1 flex-row justify-between items-center">
          <View className="flex-row items-center">
            {hasLabel && <Text className="text-sm text-darkgray font-medium">{label}</Text>}
            {required && <Text className="text-sm text-red-orange-500 ml-1">*</Text>}
          </View>
          {/* 텍스트와 롱텍스트 타입일 때만 문자 수 카운터 표시 */}
          {shouldShowCounter && (
            <Text className="text-xs text-darkgray">
              {currentLength}/{maxLengthForType}
            </Text>
          )}
        </View>
      )}

      {/* 실제 텍스트 입력 필드 */}
      <RNTextInput
        ref={inputRef}
        className={inputFieldClass}
        keyboardType={type === 'number' || type === 'date' ? 'numeric' : 'default'}
        multiline={type === 'longText'}
        textAlignVertical="center"
        placeholder={placeholder}
        placeholderTextColor="#767676"
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
        editable={editable}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        textAlign={textAlign}
      />
    </View>
  );
});

TextInputBox.displayName = 'TextInputBox';

export default TextInputBox;
