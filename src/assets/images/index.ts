export const activateIcons = {
  inactive: require('./activate/activate_inactive.png'),
  active: require('./activate/activate_active.png'),
};

export const directionImages = {
  way_front: require('./way/way_front.png'),
  way_back: require('./way/way_back.png'),
  way_plain: require('./way/way_plain.png'),
  emphasis_front: require('./way/emphasis_front.png'),
  emphasis_back: require('./way/emphasis_back.png'),
  emphasis_plain: require('./way/emphasis_plain.png'),
};

export const completeImage = require('./complete/complete_nomal.png');

/**
 * 프리미엄 구매 화면 가로 캐러셀
 * 순서: 유료 기능 2종 → 앱 테마 순(anyBlue→lavender→honeyBanana→olive→gray)마다 프로젝트 목록 → 카운터
 * (애니블루는 목록 스샷 없음 → 카운터만)
 */
export const premiumPreviewCarouselSlides = [
  {
    id: 'backup-import-modal',
    label: '데이터 불러오기',
    source: require('./premium-preview/backup-import-modal.jpg'),
  },
  {
    id: 'voice-settings',
    label: '사용자 지정 음성 인식 명령어',
    source: require('./premium-preview/voice-settings.jpg'),
  },
  {
    id: 'any-blue-counter',
    label: '애니블루 색상 테마',
    source: require('./premium-preview/any-blue-counter.jpg'),
  },
  {
    id: 'lavender-project-list',
    label: '라벤더 색상 테마',
    source: require('./premium-preview/lavender-project-list.jpg'),
  },
  {
    id: 'lavender-counter',
    label: '라벤더 색상 테마',
    source: require('./premium-preview/lavender-counter.jpg'),
  },
  {
    id: 'honey-banana-project-list',
    label: '꿀바나나 색상 테마',
    source: require('./premium-preview/honey-banana-project-list.jpg'),
  },
  {
    id: 'honey-banana-counter',
    label: '꿀바나나 색상 테마',
    source: require('./premium-preview/honey-banana-counter.jpg'),
  },
  {
    id: 'olive-project-list',
    label: '올리브 색상 테마',
    source: require('./premium-preview/olive-project-list.jpg'),
  },
  {
    id: 'olive-counter',
    label: '올리브 색상 테마',
    source: require('./premium-preview/olive-counter.jpg'),
  },
  {
    id: 'gray-project-list',
    label: '그레이 색상 테마',
    source: require('./premium-preview/gray-project-list.jpg'),
  },
  {
    id: 'gray-counter',
    label: '그레이 색상 테마',
    source: require('./premium-preview/gray-counter.jpg'),
  },
] as const;
