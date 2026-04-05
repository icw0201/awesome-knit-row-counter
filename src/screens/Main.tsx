// src/screens/Main.tsx
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow, FloatingListActionButton, ItemModals, SortDropdown } from '@components/list';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';
import { useMain } from '@hooks/useMain';

const Main = () => {
  const insets = useSafeAreaInsets();
  // useMain 훅 사용
  const {
    items,
    isEditMode,
    modalVisible,
    deleteModalVisible,
    duplicateModalVisible,
    sortDropdownVisible,
    setModalVisible,
    setSortDropdownVisible,
    handlePress,
    handleLongPress,
    selectedItemIds,
    toggleItemSelection,
    openBulkDeleteModal,
    handleCreateItemConfirm,
    handleDeleteConfirm,
    resetModalState,
    resetDeleteModalState,
    getDeleteDescription,
    handleSortSelect,
    replicateModalVisible,
    replicateModalTitle,
    replicateInitialName,
    replicatePlaceholder,
    resetReplicateModalState,
    handleCopyPress,
    handleReplicateConfirm,
    handleDuplicateModalClose,
    handleDuplicateConfirm,
    duplicateModalDescription,
    duplicateConfirmText,
  } = useMain();

  return (
    <SafeAreaView style={screenStyles.flex1} className={isEditMode ? 'bg-red-orange-400' : undefined} edges={safeAreaEdges}>
      <ScrollView contentContainerStyle={screenStyles.scrollViewContent}>
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            isEditMode={isEditMode}
            isSelected={selectedItemIds.includes(item.id)}
            onToggleSelect={toggleItemSelection}
            onPress={handlePress}
            onLongPress={handleLongPress}
            onCopyPress={handleCopyPress}
          />
        ))}
      </ScrollView>

      {/* 플로팅 추가 버튼 */}
      <FloatingListActionButton
        isEditMode={isEditMode}
        onPress={() => (isEditMode ? openBulkDeleteModal() : setModalVisible(true))}
        bottom={insets.bottom}
      />

      {/* 모든 모달들 */}
      <ItemModals
        modalType="main"
        createItemModalVisible={modalVisible}
        onCreateItemModalClose={resetModalState}
        onCreateItemModalConfirm={handleCreateItemConfirm}
        deleteModalVisible={deleteModalVisible}
        onDeleteModalClose={resetDeleteModalState}
        onDeleteConfirm={handleDeleteConfirm}
        deleteDescription={getDeleteDescription()}
        duplicateModalVisible={duplicateModalVisible}
        onDuplicateModalClose={handleDuplicateModalClose}
        onDuplicateConfirm={handleDuplicateConfirm}
        duplicateDescription={duplicateModalDescription}
        duplicateConfirmText={duplicateConfirmText}
        replicateModalVisible={replicateModalVisible}
        replicateModalTitle={replicateModalTitle}
        replicateInitialName={replicateInitialName}
        replicatePlaceholder={replicatePlaceholder}
        onReplicateModalClose={resetReplicateModalState}
        onReplicateModalConfirm={handleReplicateConfirm}
      />

      {/* 정렬 드롭다운: 정렬 버튼 바로 아래 표시 */}
      <SortDropdown
        visible={sortDropdownVisible}
        onClose={() => setSortDropdownVisible(false)}
        onSelect={handleSortSelect}
      />
    </SafeAreaView>
  );
};

export default Main;
