import React, { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { ConfirmModal } from '@components/common/modals';
import {
  exportBackupToTemporaryFile,
  getBackupSummary,
  pickBackupDocument,
  restoreBackupDocument,
  shareBackupFile,
  type BackupDocument,
} from '@storage/backup';
import IconBox from './IconBox';

interface SettingsBackupProps {}

const SettingsBackup: React.FC<SettingsBackupProps> = () => {
  const navigation = useNavigation();
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

  const resetToMain = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  }, [navigation]);

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

  const handleImportConfirm = useCallback(async () => {
    if (!pendingImportDocument) {
      return;
    }

    setIsBusy(true);

    try {
      restoreBackupDocument(pendingImportDocument);
      setPendingImportDocument(null);
      showNoticeModal(
        '불러오기 완료',
        '백업 데이터를 불러왔습니다.\n확인을 누르면 메인 화면으로 돌아갑니다.',
        resetToMain
      );
    } catch (error) {
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

  const handleNoticeConfirm = useCallback(() => {
    const callback = onNoticeConfirmRef.current;
    onNoticeConfirmRef.current = null;
    callback?.();
  }, []);

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
      <View className="mb-8">
        <Text className="mb-3 px-1 text-sm font-semibold text-darkgray">
          백업 및 복원
        </Text>
        <IconBox
          title={isBusy ? '처리 중...' : '데이터 내보내기'}
          iconName="download"
          onPress={async () => {
            await handleExportPress();
          }}
        />
        <IconBox
          title={isBusy ? '처리 중...' : '데이터 불러오기'}
          iconName="upload"
          onPress={async () => {
            await handleImportPress();
          }}
        />
      </View>

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
