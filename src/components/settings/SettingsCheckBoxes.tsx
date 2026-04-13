// src/components/settings/SettingsCheckBoxes.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput as RNTextInput } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';

import CheckBox from '@components/common/CheckBox';
import TextInputBox, { TextInputBoxRef } from '@components/common/TextInputBox';
import { ConfirmModal } from '@components/common/modals';
import { clearAllProjectData } from '@storage/storage';
import SettingsAccordion from './SettingsAccordion';
import {
  setSoundSetting,
  setVibrationSetting,
  getSoundSetting,
  getVibrationSetting,
  getScreenAwakeSetting,
  setScreenAwakeSetting,
  getTooltipEnabledSetting,
  setTooltipEnabledSetting,
  getAutoPlayElapsedTimeSetting,
  setAutoPlayElapsedTimeSetting,
} from '@storage/settings';

interface SettingsCheckBoxesProps {
  onVoiceInputFocus?: (input: RNTextInput | null) => void;
}

interface SettingsItem {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

interface SettingsSectionProps {
  title: string;
  items: SettingsItem[];
  titleClassName?: string;
}

type VoiceCommandGroupKey =
  | 'mainDecrease'
  | 'mainIncrease'
  | 'subDecrease'
  | 'subIncrease';

type VoiceCommandMode = 'default' | 'custom';

interface VoiceCommandRowConfig {
  key: VoiceCommandGroupKey;
  sectionTitle: string;
  label: string;
  placeholders: [string, string, string];
}

interface SectionHeaderProps {
  title: string;
  titleClassName?: string;
}

const DEFAULT_VOICE_COMMAND_SECTIONS = [
  {
    title: '메인 카운터',
    description: '연지(현지, 연기) / 곤지(군지, 건기)',
  },
  {
    title: '보조 카운터',
    description: '청실(청신, 창신) / 홍실(홍신, 동실)',
  },
] as const;

const VOICE_COMMAND_ROW_CONFIGS: VoiceCommandRowConfig[] = [
  {
    key: 'mainDecrease',
    sectionTitle: '메인 카운터',
    label: '카운트 감소',
    placeholders: ['딸기', '달기', '탈기'],
  },
  {
    key: 'mainIncrease',
    sectionTitle: '메인 카운터',
    label: '카운트 증가',
    placeholders: ['사과', '사와', '서과'],
  },
  {
    key: 'subDecrease',
    sectionTitle: '보조 카운터',
    label: '카운트 감소',
    placeholders: ['루크', '무크', '구크'],
  },
  {
    key: 'subIncrease',
    sectionTitle: '보조 카운터',
    label: '카운트 증가',
    placeholders: ['제이', '체이', '데이'],
  },
];

const VOICE_COMMAND_INPUT_ORDER = VOICE_COMMAND_ROW_CONFIGS.flatMap((config) =>
  config.placeholders.map((_, index) => ({
    key: config.key,
    index,
    id: `${config.key}-${index}`,
  }))
);

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  titleClassName = 'text-darkgray',
}) => {
  return (
    <View className="mb-2 flex-row items-center px-4">
      <Text className={`mr-3 text-sm font-semibold ${titleClassName}`}>
        {title}
      </Text>
      <View className="flex-1 border-b border-lightgray" />
    </View>
  );
};

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  items,
  titleClassName = 'text-darkgray',
}) => {
  return (
    <View className="mb-6">
      <SectionHeader title={title} titleClassName={titleClassName} />
      <View>
        {items.map((item) => (
          <View key={item.label}>
            <CheckBox
              label={item.label}
              checked={item.checked}
              onToggle={item.onToggle}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * 설정 화면의 체크박스들을 묶은 컴포넌트
 */
const SettingsCheckBoxes: React.FC<SettingsCheckBoxesProps> = ({
  onVoiceInputFocus,
}) => {
  // 네비게이션 객체
  const navigation = useNavigation();

  // 설정 상태 관리
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [screenAwake, setScreenAwake] = useState(true);
  const [tooltipEnabled, setTooltipEnabled] = useState(true);
  const [autoPlayElapsedTime, setAutoPlayElapsedTime] = useState(true);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedVoiceCommandMode, setSelectedVoiceCommandMode] =
    useState<VoiceCommandMode>('default');
  const [voiceCommandInputs, setVoiceCommandInputs] = useState<
    Record<VoiceCommandGroupKey, [string, string, string]>
  >({
    mainDecrease: ['', '', ''],
    mainIncrease: ['', '', ''],
    subDecrease: ['', '', ''],
    subIncrease: ['', '', ''],
  });
  const voiceInputRefs = useRef<Record<string, TextInputBoxRef | null>>({});

  useEffect(() => {
    setSound(getSoundSetting());
    setVibration(getVibrationSetting());
    setScreenAwake(getScreenAwakeSetting());
    setTooltipEnabled(getTooltipEnabledSetting());
    setAutoPlayElapsedTime(getAutoPlayElapsedTimeSetting());
  }, []);

  /**
   * 에러 모달 표시
   */
  const showErrorModal = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  }, []);

  /**
   * 소리 설정 토글 처리
   */
  const handleSoundToggle = () => {
    const newValue = !sound;
    setSound(newValue);
    setSoundSetting(newValue);
  };

  /**
   * 진동 설정 토글 처리
   */
  const handleVibrationToggle = () => {
    const newValue = !vibration;
    setVibration(newValue);
    setVibrationSetting(newValue);
  };

  /**
   * 화면 켜짐 설정 토글 처리
   */
  const handleScreenAwakeToggle = () => {
    const newValue = !screenAwake;
    setScreenAwake(newValue);
    setScreenAwakeSetting(newValue);
  };

  /**
   * 툴팁 표시 설정 토글 처리
   */
  const handleTooltipToggle = () => {
    const newValue = !tooltipEnabled;
    setTooltipEnabled(newValue);
    setTooltipEnabledSetting(newValue);
  };

  /**
   * 타이머 자동 재생 설정 토글 처리
   */
  const handleAutoPlayElapsedTimeToggle = () => {
    const newValue = !autoPlayElapsedTime;
    setAutoPlayElapsedTime(newValue);
    setAutoPlayElapsedTimeSetting(newValue);
  };

  /**
   * 초기화 확인 모달 열기
   */
  const handleResetToggle = () => {
    setResetModalVisible(true);
  };

  /**
   * 초기화 실행 및 앱 재시작
   */
  const handleResetConfirm = () => {
    try {
      // 모든 프로젝트 데이터 삭제
      clearAllProjectData();

      // 상태 초기화
      setResetModalVisible(false);

      // 앱을 Main 화면으로 재시작
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error) {
      showErrorModal('초기화 중 오류가 발생했습니다.');
    }
  };

  /**
   * 초기화 모달 닫기 및 상태 초기화
   */
  const handleResetModalClose = () => {
    setResetModalVisible(false);
  };

  /**
   * 사용자 지정 음성 명령어 토글 처리
   */
  const handleCustomVoiceCommandsToggle = () => {
    setSelectedVoiceCommandMode('custom');
  };

  /**
   * 기본 음성 명령어 설정 선택 처리
   */
  const handleDefaultVoiceCommandsToggle = () => {
    setSelectedVoiceCommandMode('default');
  };

  /**
   * 사용자 지정 음성 명령어 입력 처리
   */
  const handleVoiceCommandInputChange = useCallback((
    key: VoiceCommandGroupKey,
    index: number,
    text: string
  ) => {
    setVoiceCommandInputs((prev) => {
      const nextValues = [...prev[key]] as [string, string, string];
      nextValues[index] = text.slice(0, 2);

      return {
        ...prev,
        [key]: nextValues,
      };
    });
  }, []);

  /**
   * 음성 명령어 입력칸의 다음 포커스를 이동한다.
   */
  const handleVoiceCommandSubmitEditing = useCallback((
    key: VoiceCommandGroupKey,
    index: number
  ) => {
    const currentInputIndex = VOICE_COMMAND_INPUT_ORDER.findIndex(
      (item) => item.key === key && item.index === index
    );

    if (currentInputIndex < 0) {
      return;
    }

    const nextInput = VOICE_COMMAND_INPUT_ORDER[currentInputIndex + 1];

    if (nextInput) {
      voiceInputRefs.current[nextInput.id]?.focus();
      return;
    }

    voiceInputRefs.current[`${key}-${index}`]?.blur();
  }, []);

  const deviceSettings: SettingsItem[] = [
    {
      label: '스크린 항상 켜두기',
      checked: screenAwake,
      onToggle: handleScreenAwakeToggle,
    },
    {
      label: '소리',
      checked: sound,
      onToggle: handleSoundToggle,
    },
    {
      label: '진동',
      checked: vibration,
      onToggle: handleVibrationToggle,
    },
  ];

  const counterSettings: SettingsItem[] = [
    {
      label: '툴팁 표시하기',
      checked: tooltipEnabled,
      onToggle: handleTooltipToggle,
    },
    {
      label: '타이머 자동 재생',
      checked: autoPlayElapsedTime,
      onToggle: handleAutoPlayElapsedTimeToggle,
    },
  ];

  const dangerSettings: SettingsItem[] = [
    {
      label: '초기화하기',
      checked: false,
      onToggle: handleResetToggle,
    },
  ];

  const mainCounterVoiceCommandRows = VOICE_COMMAND_ROW_CONFIGS.filter(
    (config) => config.sectionTitle === '메인 카운터'
  );
  const subCounterVoiceCommandRows = VOICE_COMMAND_ROW_CONFIGS.filter(
    (config) => config.sectionTitle === '보조 카운터'
  );

  const renderVoiceCommandInputRow = useCallback((config: VoiceCommandRowConfig) => {
    return (
      <View key={config.key} className="mb-3 flex-row items-center pl-2">
        <View className="w-24 pr-3">
          <Text className="text-base text-black">{config.label}</Text>
        </View>

        <View className="flex-1 pl-3">
          <View className="flex-row">
            <View className="flex-1 pr-2">
              <TextInputBox
                ref={(ref) => {
                  voiceInputRefs.current[`${config.key}-0`] = ref;
                }}
                label=""
                value={voiceCommandInputs[config.key][0]}
                onChangeText={(text) =>
                  handleVoiceCommandInputChange(config.key, 0, text)
                }
                placeholder={config.placeholders[0]}
                type="text"
                maxLength={2}
                showCounter={false}
                inputClassName="h-11 text-base text-center"
                containerClassName="mb-0 flex-1"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="center"
                fillWidth={false}
                returnKeyType="next"
                onSubmitEditing={() =>
                  handleVoiceCommandSubmitEditing(config.key, 0)
                }
                onFocus={() =>
                  onVoiceInputFocus?.(
                    voiceInputRefs.current[`${config.key}-0`]?.getNativeRef() ?? null
                  )
                }
                blurOnSubmit={false}
              />
            </View>

            <View className="mr-2 h-11 border-l border-lightgray" />

            <View className="flex-[2] flex-row">
              {config.placeholders.slice(1).map((placeholder, offset) => {
                const index = offset + 1;

                return (
                  <TextInputBox
                    key={`${config.key}-${index}`}
                    ref={(ref) => {
                      voiceInputRefs.current[`${config.key}-${index}`] = ref;
                    }}
                    label=""
                    value={voiceCommandInputs[config.key][index]}
                    onChangeText={(text) =>
                      handleVoiceCommandInputChange(config.key, index, text)
                    }
                    placeholder={placeholder}
                    type="text"
                    maxLength={2}
                    showCounter={false}
                    inputClassName="h-11 text-base text-center"
                    containerClassName={`mb-0 flex-1 ${
                      offset === 0 ? '' : 'ml-2'
                    }`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textAlign="center"
                    fillWidth={false}
                    returnKeyType={
                      config.key === 'subIncrease' && index === 2 ? 'done' : 'next'
                    }
                    onSubmitEditing={() =>
                      handleVoiceCommandSubmitEditing(config.key, index)
                    }
                    onFocus={() =>
                      onVoiceInputFocus?.(
                        voiceInputRefs.current[`${config.key}-${index}`]?.getNativeRef() ?? null
                      )
                    }
                    blurOnSubmit={config.key === 'subIncrease' && index === 2}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  }, [
    handleVoiceCommandInputChange,
    handleVoiceCommandSubmitEditing,
    onVoiceInputFocus,
    voiceCommandInputs,
  ]);

  return (
    <>
      <View className="mb-6">
        <SettingsSection title="기기 설정" items={deviceSettings} />
        <SettingsSection title="카운터 설정" items={counterSettings} />
        <View className="mb-6">
          <SectionHeader title="음성인식 명령어" />

          <View className="mb-3 rounded-2xl border border-lightgray bg-transparent py-2">
            <SettingsAccordion
              label="기본 설정"
              checked={selectedVoiceCommandMode === 'default'}
              onToggle={handleDefaultVoiceCommandsToggle}
            >
              {DEFAULT_VOICE_COMMAND_SECTIONS.map((section, index) => (
                <View
                  key={section.title}
                  className={`pl-4 ${
                    index === DEFAULT_VOICE_COMMAND_SECTIONS.length - 1 ? 'pb-2' : ''
                  } ${
                    index === 0 ? 'mb-3' : ''
                  }`}
                >
                  <Text className="text-base font-semibold text-black">
                    {section.title}
                  </Text>
                  <Text className="pl-4 pt-1 text-base leading-6 text-black">
                    {section.description}
                  </Text>
                </View>
              ))}
            </SettingsAccordion>
          </View>

          <View className="rounded-2xl border border-lightgray bg-transparent py-2">
            <SettingsAccordion
              label="사용자 설정"
              checked={selectedVoiceCommandMode === 'custom'}
              onToggle={handleCustomVoiceCommandsToggle}
            >
              <View className="mb-4 pl-4">
                <Text className="mb-3 text-base font-medium text-black">
                  메인 카운터
                </Text>
                <View className="mb-3 flex-row items-end pl-2">
                  <View className="w-24 pr-3" />
                  <View className="flex-1 pl-3">
                    <View className="flex-row">
                      <View className="flex-1 pr-2">
                        <Text className="text-center text-xs text-darkgray">
                          명령어
                        </Text>
                      </View>
                      <View className="flex-[2]">
                        <Text className="text-center text-xs text-darkgray">
                          유사어
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {mainCounterVoiceCommandRows.map(renderVoiceCommandInputRow)}
              </View>

              <View className="pl-4">
                <Text className="mb-3 text-base font-medium text-black">
                  보조 카운터
                </Text>
                {subCounterVoiceCommandRows.map(renderVoiceCommandInputRow)}
              </View>
            </SettingsAccordion>
          </View>
        </View>
        <SettingsSection
          title="데이터 관리"
          items={dangerSettings}
          titleClassName="text-red-orange-500"
        />
      </View>

      {/* 초기화 확인 모달 */}
      <ConfirmModal
        visible={resetModalVisible}
        onClose={handleResetModalClose}
        title="초기화"
        description="정말 프로젝트 정보를 모두 삭제하시겠습니까?"
        onConfirm={handleResetConfirm}
        confirmText="삭제"
        cancelText="취소"
      />

      {/* 에러 알림 모달 */}
      <ConfirmModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="오류"
        description={errorMessage}
        onConfirm={() => setErrorModalVisible(false)}
        confirmText="확인"
        cancelText=""
      />
    </>
  );
};

export default SettingsCheckBoxes;
