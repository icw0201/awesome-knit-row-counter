// src/screens/ProjectDetail.tsx
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow, FloatingAddButton, ItemModals, SortDropdown } from '@components/list';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';
import { useProjectDetail } from '@hooks/useProjectDetail';

const ProjectDetail = () => {
  const insets = useSafeAreaInsets();
  // useProjectDetail 훅 사용
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
    handleCreateCounterConfirm,
    handleDeleteConfirm,
    resetModalState,
    resetDeleteModalState,
    resetDuplicateModalState,
    handleSortSelect,
    getDeleteDescription,
    replicateModalVisible,
    replicateInitialName,
    resetReplicateModalState,
    handleCopyPress,
    handleReplicateConfirm,
    handleDuplicateConfirm,
  } = useProjectDetail();

  return (
    <SafeAreaView style={screenStyles.flex1} className={isEditMode ? 'bg-red-orange-400' : undefined} edges={safeAreaEdges}>
      {/* 카운터 목록 스크롤뷰 */}
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
      <FloatingAddButton
        isEditMode={isEditMode}
        onPress={() => (isEditMode ? openBulkDeleteModal() : setModalVisible(true))}
        bottom={insets.bottom}
      />

      {/* 모든 모달들 */}
      <ItemModals
        modalType="project"
        createCounterModalVisible={modalVisible}
        onCreateCounterModalClose={resetModalState}
        onCreateCounterModalConfirm={(name) => handleCreateCounterConfirm(name)}
        deleteModalVisible={deleteModalVisible}
        onDeleteModalClose={resetDeleteModalState}
        onDeleteConfirm={handleDeleteConfirm}
        deleteDescription={getDeleteDescription()}
        duplicateModalVisible={duplicateModalVisible}
        onDuplicateModalClose={() => {
          resetDuplicateModalState();
        }}
        onDuplicateConfirm={handleDuplicateConfirm}
        duplicateDescription="같은 이름의 카운터가 이미 존재합니다. 생성하시겠습니까?"
        replicateModalVisible={replicateModalVisible}
        replicateModalTitle="카운터 복제하기"
        replicateInitialName={replicateInitialName}
        onReplicateModalClose={resetReplicateModalState}
        onReplicateModalConfirm={handleReplicateConfirm}
      />

      {/* 정렬 드롭다운: 정렬 버튼 바로 아래 표시*/}
      <SortDropdown
        visible={sortDropdownVisible}
        onClose={() => setSortDropdownVisible(false)}
        onSelect={handleSortSelect}
      />
    </SafeAreaView>
  );
};

export default ProjectDetail;
