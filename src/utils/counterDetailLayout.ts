import { ScreenSize, getCounterDetailVerticalBands, getSegmentModalCenterY, getSegmentModalHeightRatio, getSubModalCenterY, getSubModalHandleWidth, getSubModalHeightRatio } from '@constants/screenSizeConfig';

type VisibilityInput = {
  screenSize: ScreenSize;
  timerIsActive: boolean;
  subModalIsOpen: boolean;
};

export type CounterDetailVisibility = {
  showTimeDisplay: boolean;
  showCounterActions: boolean;
  shouldStartContentFromTop: boolean;
};

type VerticalPxInput = {
  contentAreaHeight: number;
  progressBarHeightPx: number;
  timerEndPercent: number;
  contentStartPercent: number;
  contentEndPercent: number;
  shouldStartContentFromTop: boolean;
};

export type CounterDetailVerticalPx = {
  timerHeightPx: number;
  gapBetweenTimerAndContentPx: number;
  contentHeightPx: number;
  bottomReservedHeightPx: number;
};

export type CounterDetailModalLayout = {
  subModalWidth: number;
  subModalHeight: number;
  subModalCenterY: number;
  subModalHandleWidth: number;
  segmentModalWidth: number;
  segmentModalHeight: number;
  segmentModalCenterY: number;
};

export type ContentSectionFlexes = {
  directionSectionFlex: number;
  voiceBannerSectionFlex: number;
  countSectionFlex: number;
  actionsSectionFlex: number;
};

export const getCounterDetailVisibility = ({
  screenSize,
  timerIsActive,
  subModalIsOpen,
}: VisibilityInput): CounterDetailVisibility => {
  const showTimeDisplay =
    timerIsActive &&
    (screenSize === ScreenSize.LARGE ||
      (screenSize !== ScreenSize.COMPACT && !(screenSize === ScreenSize.SMALL && subModalIsOpen)));
  const showCounterActions =
    screenSize === ScreenSize.LARGE || (screenSize === ScreenSize.SMALL && !subModalIsOpen);
  const shouldStartContentFromTop =
    !showTimeDisplay && (screenSize === ScreenSize.COMPACT || screenSize === ScreenSize.SMALL);

  return { showTimeDisplay, showCounterActions, shouldStartContentFromTop };
};

export const getContentSectionFlexes = (
  mascotIsActive: boolean,
  showCounterActions: boolean,
  showVoiceBanner: boolean
): ContentSectionFlexes => {
  const voiceBannerSectionFlex = showVoiceBanner ? 0.1 : 0;
  const directionSectionFlex = mascotIsActive ? (showVoiceBanner ? 0.28 : 0.35) : 0;
  const actionsSectionFlex = mascotIsActive ? 0.3 : 0.4;
  const countSectionFlex = mascotIsActive
    ? 1 - directionSectionFlex - voiceBannerSectionFlex - (showCounterActions ? actionsSectionFlex : 0)
    : 1 - voiceBannerSectionFlex - (showCounterActions ? actionsSectionFlex : 0);

  return {
    directionSectionFlex,
    voiceBannerSectionFlex,
    countSectionFlex,
    actionsSectionFlex,
  };
};

export const getCounterDetailVerticalPx = ({
  contentAreaHeight,
  progressBarHeightPx,
  timerEndPercent,
  contentStartPercent,
  contentEndPercent,
  shouldStartContentFromTop,
}: VerticalPxInput): CounterDetailVerticalPx => {
  const effectiveTimerEndPercent = shouldStartContentFromTop ? 0 : timerEndPercent;
  const effectiveContentStartPercent = shouldStartContentFromTop ? 0 : contentStartPercent;

  const timerHeightPx = shouldStartContentFromTop
    ? 0
    : Math.max(0, (contentAreaHeight * effectiveTimerEndPercent) / 100 - progressBarHeightPx);
  const gapBetweenTimerAndContentPx = shouldStartContentFromTop
    ? 0
    : (contentAreaHeight * (effectiveContentStartPercent - effectiveTimerEndPercent)) / 100;
  const contentHeightPx = shouldStartContentFromTop
    ? (contentAreaHeight * contentEndPercent) / 100 - progressBarHeightPx
    : (contentAreaHeight * (contentEndPercent - effectiveContentStartPercent)) / 100;
  const bottomReservedHeightPx = contentAreaHeight - progressBarHeightPx - (timerHeightPx + gapBetweenTimerAndContentPx + contentHeightPx);

  return {
    timerHeightPx,
    gapBetweenTimerAndContentPx,
    contentHeightPx,
    bottomReservedHeightPx,
  };
};

export const getCounterDetailModalLayout = (
  contentAreaHeight: number,
  width: number,
  screenSize: ScreenSize
): CounterDetailModalLayout => {
  const subModalWidth = width * 0.9;
  const subModalHeight = contentAreaHeight * getSubModalHeightRatio(screenSize);
  const subModalCenterY = (contentAreaHeight * getSubModalCenterY(screenSize)) / 100;
  const subModalHandleWidth = getSubModalHandleWidth(screenSize);

  const segmentModalWidth = subModalWidth;
  const segmentModalHeight = contentAreaHeight * getSegmentModalHeightRatio(screenSize);
  const segmentModalCenterY = (contentAreaHeight * getSegmentModalCenterY(screenSize)) / 100;

  return {
    subModalWidth,
    subModalHeight,
    subModalCenterY,
    subModalHandleWidth,
    segmentModalWidth,
    segmentModalHeight,
    segmentModalCenterY,
  };
};

export const getCounterDetailVerticalPercents = (screenSize: ScreenSize) => {
  return getCounterDetailVerticalBands(screenSize);
};
