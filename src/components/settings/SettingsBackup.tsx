import React, { useCallback, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Star } from 'lucide-react-native';

import { ConfirmModal } from '@components/common/modals';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { appTheme } from '@styles/appTheme';
import {
  exportBackupToTemporaryFile,
  getBackupSummary,
  pickBackupDocument,
  restoreBackupDocument,
  shareBackupFile,
  type BackupDocument,
} from '@storage/backup';
import { useIapContext } from '@provider/IapProvider';
import IconBox from './IconBox';
import SettingsSectionHeader from './SettingsSectionHeader';

// 설정: 백업 파일 내보내기·불러오기, 프리미엄 잠금 및 복원 후 안내 모달.

// 설정 백업 블록용 프롭(필요 시 확장).

interface SettingsBackupProps {}

const SettingsBackup: React.FC<SettingsBackupProps> = () => {
  // 네비게이션, 프리미엄 여부, 공지 확인 콜백 ref, 불러오기·모달·처리 중 상태.
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { premiumUnlocked } = useIapContext();
  const onNoticeConfirmRef = useRef<(() => void) | null>(null);

  const [pendingImportDocument, setPendingImportDocument] = useState<BackupDocument | null>(
    null
  );
  const [importConfirmVisible, setImportConfirmVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // 복원 완료 등 이후 메인 화면으로 스택을 초기화.
  const resetToMain = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  }, [navigation]);

  // 오류·안내 모달 표시와 사용자에게 보여줄 에러 문구 정리.
  const showErrorModal = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  }, []);

  const showNoticeModal = useCallback((
    title: string,
    description: string,
    onConfirm?: () => void
  ) => {
    onNoticeConfirmRef.current = onConfirm ?? null;
    setNoticeTitle(title);
    setNoticeMessage(description);
    setNoticeModalVisible(true);
  }, []);

  const getReadableErrorMessage = useCallback((error: unknown) => {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return '처리 중 오류가 발생했습니다.';
  }, []);

  // 임시 백업 파일 생성 후 OS 공유 시트로 내보내기.
  const handleExportPress = useCallback(async () => {
    if (isBusy) {
      return;
    }

    setIsBusy(true);

    try {
      const { fileUri } = await exportBackupToTemporaryFile();
      await shareBackupFile(fileUri);
    } catch (error) {
      showErrorModal(getReadableErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }, [getReadableErrorMessage, isBusy, showErrorModal]);

  // 백업 파일 선택 후 덮어쓰기 확인 모달을 띄울 데이터만 준비.
  const handleImportPress = useCallback(async () => {
    if (isBusy) {
      return;
    }

    setIsBusy(true);

    try {
      const document = await pickBackupDocument();

      if (!document) {
        return;
      }

      setPendingImportDocument(document);
      setImportConfirmVisible(true);
    } catch (error) {
      showErrorModal(getReadableErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }, [getReadableErrorMessage, isBusy, showErrorModal]);

  // 확인 시 스토리지 복원 → 완료 공지(확인 시 메인으로 이동).
  const handleImportConfirm = useCallback(async () => {
    if (!pendingImportDocument) {
      return;
    }

    setIsBusy(true);

    try {
      await restoreBackupDocument(pendingImportDocument);
      setPendingImportDocument(null);
      showNoticeModal(
        '불러오기 완료',
        '백업 데이터를 불러왔습니다.\n확인을 누르면 메인 화면으로 돌아갑니다.',
        resetToMain
      );
    } catch (error) {
      console.error('SettingsBackup: restore backup failed', error);
      showErrorModal(getReadableErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }, [
    getReadableErrorMessage,
    pendingImportDocument,
    resetToMain,
    showErrorModal,
    showNoticeModal,
  ]);

  // 안내 모달에서 확인을 누르면 ref에 넣어 둔 후속 동작(예: resetToMain) 실행.
  const handleNoticeConfirm = useCallback(() => {
    const callback = onNoticeConfirmRef.current;
    onNoticeConfirmRef.current = null;
    callback?.();
  }, []);

  // 불러오기 확인 모달 본문: 경고 문구 + 선택한 백업의 요약(시각·개수 등).
  const importDescription = pendingImportDocument
    ? (() => {
      const summary = getBackupSummary(pendingImportDocument);

      return [
        '불러오기를 진행하면 현재 기기의 데이터가 백업 내용으로 덮어써집니다.',
        '',
        `백업 시각: ${summary.exportedAtLabel}`,
        `프로젝트: ${summary.projectCount}개`,
        `카운터: ${summary.counterCount}개`,
        `전체 항목: ${summary.totalItems}개`,
      ].join('\n');
    })()
    : '';

  return (
    <>
      {/* 백업 섹션: 제목·안내 문구·내보내기/불러오기(및 미구독 시 잠금 UI). */}
      <View className="mb-8">
        <SettingsSectionHeader title="백업 및 복원" />
        <Text className="mb-4 pl-6 pr-1 text-xs font-normal leading-5 text-darkgray">
          앱 데이터는 이 기기에만 저장됩니다. 앱을 삭제하거나 기기를 바꾸면 데이터가
          사라질 수 있으니, 파일로 내보내 두었다가 필요할 때 불러와 복구할 수 있습니다.
        </Text>
        {/* IconBox 두 줄과, 미구독일 때만 씌우는 multiply·구매 진입·별 표시. */}
        <View className="relative">
          <IconBox
            title={isBusy ? '처리 중...' : '데이터 내보내기'}
            iconName="download"
            disabled={!premiumUnlocked}
            onPress={async () => {
              await handleExportPress();
            }}
          />
          <IconBox
            title={isBusy ? '처리 중...' : '데이터 불러오기'}
            iconName="upload"
            disabled={!premiumUnlocked}
            onPress={async () => {
              await handleImportPress();
            }}
          />
          {!premiumUnlocked ? (
            <>
              <View
                className="pointer-events-none absolute -inset-2 z-[5] rounded-2xl bg-mediumgray overflow-hidden"
                style={{ mixBlendMode: 'multiply' }}
              />
              <TouchableOpacity
                activeOpacity={1}
                className="absolute -inset-2 z-[10] rounded-2xl"
                onPress={() => navigation.navigate('PremiumPurchase')}
                accessibilityRole="button"
                accessibilityLabel="백업 및 복원, 프리미엄 전용"
                accessibilityHint="탭하면 프리미엄 구매 화면으로 이동합니다."
              />
              <View
                className="pointer-events-none absolute right-4 top-0 z-[20] w-6 items-center justify-center"
                style={{ height: '50%' }}
              >
                <Star
                  size={22}
                  color={appTheme.colors.premiumGold}
                  fill={appTheme.colors.premiumGold}
                />
              </View>
              <View
                className="pointer-events-none absolute bottom-0 right-4 z-[20] w-6 items-center justify-center"
                style={{ height: '50%' }}
              >
                <Star
                  size={22}
                  color={appTheme.colors.premiumGold}
                  fill={appTheme.colors.premiumGold}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>

      {/* 불러오기 확인, 완료 안내, 오류 각각 전용 ConfirmModal. */}
      <ConfirmModal
        visible={importConfirmVisible}
        onClose={() => {
          setImportConfirmVisible(false);
          setPendingImportDocument(null);
        }}
        title="데이터 불러오기"
        description={importDescription}
        onConfirm={async () => {
          await handleImportConfirm();
        }}
        confirmText="불러오기"
        cancelText="취소"
      />

      <ConfirmModal
        visible={noticeModalVisible}
        onClose={() => {
          onNoticeConfirmRef.current = null;
          setNoticeModalVisible(false);
        }}
        title={noticeTitle}
        description={noticeMessage}
        onConfirm={handleNoticeConfirm}
        confirmText="확인"
        cancelText=""
      />

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

export default SettingsBackup;
