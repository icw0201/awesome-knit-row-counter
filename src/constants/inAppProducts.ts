// src/constants/inAppProducts.ts
// Google Play / App Store Connect에 등록한 일회성(비소모성) 인앱 상품 ID와 동일해야 합니다.

/** 프리미엄 일회성 구매 SKU (Android·iOS 공통 ID 사용 권장)
 * Google Play에 등록된 상품 ID: premium_version
 * 패키지명 없이 상품 ID만 사용
 */
export const PREMIUM_INAPP_PRODUCT_ID = 'premium_version';

export const PREMIUM_INAPP_PRODUCT_IDS = [PREMIUM_INAPP_PRODUCT_ID] as const;

export function isPremiumInAppProductId(productId: string): boolean {
  return (PREMIUM_INAPP_PRODUCT_IDS as readonly string[]).includes(productId);
}
