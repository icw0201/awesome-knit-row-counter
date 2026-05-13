// src/providers/IapProvider.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import {
  useIAP,
  isUserCancelledError,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';

import { PREMIUM_INAPP_PRODUCT_IDS, isPremiumInAppProductId } from '@constants/inAppProducts';
import {
  getPremiumUnlocked,
  setPremiumUnlocked,
  subscribePremiumUnlockedChange,
} from '@storage/settings';

/** useIAP이 마운트된 뒤에만 채워짐 — 첫 프레임에는 초기 빌링 연결 없이 진행한다. */
type BillingApisPatch = {
  connected: boolean;
  premiumDisplayPrice: string | null;
  requestPurchase: ReturnType<typeof useIAP>['requestPurchase'];
  restorePurchases: ReturnType<typeof useIAP>['restorePurchases'];
};

type IapContextValue = {
  premiumUnlocked: boolean;
  /** Billing 연결 및 initConnection 성공 */
  iapReady: boolean;
  premiumDisplayPrice: string | null;
  purchasePremium: () => Promise<void>;
  restorePremium: () => Promise<void>;
  purchaseBusy: boolean;
  restoreBusy: boolean;
  lastError: string | null;
  clearLastError: () => void;
  /** 테스트용: MMKV 플래그만 해제 후 UI 동기화. 빌링/스토어 구매는 변경 없음 — 출시 전 제거 */
  resetLocalPremiumForTesting: () => void;
};

const IapContext = createContext<IapContextValue | null>(null);

export function useIapContext(): IapContextValue {
  const ctx = useContext(IapContext);
  if (ctx == null) {
    throw new Error('useIapContext는 IapProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}

const PREMIUM_SKUS = [...PREMIUM_INAPP_PRODUCT_IDS];

const emptyBillingApis = (): BillingApisPatch => ({
  connected: false,
  premiumDisplayPrice: null,
  requestPurchase:
    ((_args: Parameters<BillingApisPatch['requestPurchase']>[0]) =>
      Promise.resolve()) as BillingApisPatch['requestPurchase'],
  restorePurchases: async () => {
    //
  },
});

/**
 * 첫 레이아웃·네이티브 활동 준비 이후에만 useIAP( OpenIAP / Play Billing 초기화 )를 건다.
 * 내부 테스트 AAB에서 Activity 초기 단계 타이밍과 겹치면 JS가 멎거나 크래시가 나며 흰 화면으로 보일 수 있어 분리했다.
 */
function IapBillingConnection({
  billingRef,
  finishTransactionRef,
  applyPremiumFromPurchases,
  setPremiumUnlockedState,
  bump,
  setPurchaseBusy,
  setLastError,
}: {
  billingRef: React.MutableRefObject<BillingApisPatch>;
  finishTransactionRef: React.MutableRefObject<
    ((args: { purchase: Purchase; isConsumable?: boolean | null }) => Promise<void>) | null
  >;
  applyPremiumFromPurchases: (purchases: Purchase[]) => void;
  setPremiumUnlockedState: React.Dispatch<React.SetStateAction<boolean>>;
  bump: () => void;
  setPurchaseBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setLastError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const onPurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      if (!isPremiumInAppProductId(purchase.productId)) {
        return;
      }
      try {
        const finish = finishTransactionRef.current;
        if (finish) {
          await finish({ purchase, isConsumable: false });
        }
        setPremiumUnlocked(true);
        setPremiumUnlockedState(true);
        setLastError(null);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e));
      } finally {
        setPurchaseBusy(false);
      }
    },
    [
      finishTransactionRef,
      setPremiumUnlockedState,
      setLastError,
      setPurchaseBusy,
    ]
  );

  const onPurchaseError = useCallback(
    (error: PurchaseError) => {
      setPurchaseBusy(false);
      if (isUserCancelledError(error)) {
        return;
      }
      setLastError(error.message);
    },
    [setLastError, setPurchaseBusy]
  );

  const onError = useCallback(
    (error: Error) => {
      setLastError(error.message);
    },
    [setLastError]
  );

  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    requestPurchase,
    restorePurchases,
    finishTransaction,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess,
    onPurchaseError,
    onError,
  });

  useEffect(() => {
    finishTransactionRef.current = finishTransaction;
  }, [finishTransaction, finishTransactionRef]);

  useEffect(() => {
    const premiumProduct = products.find((p) => isPremiumInAppProductId(p.id)) ?? null;

    billingRef.current = {
      connected,
      premiumDisplayPrice: premiumProduct?.displayPrice ?? null,
      requestPurchase,
      restorePurchases,
    };
    bump();
  }, [connected, products, requestPurchase, restorePurchases, billingRef, bump]);

  useEffect(() => {
    if (!connected) {
      return;
    }
    void fetchProducts({ skus: PREMIUM_SKUS, type: 'in-app' });
  }, [connected, fetchProducts]);

  useEffect(() => {
    if (!connected) {
      return;
    }
    void (async () => {
      try {
        await getAvailablePurchases();
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        console.error('[IAP] getAvailablePurchases at startup', e);
        setLastError(`시작 시 구매 내역을 불러오지 못했습니다: ${detail}`);
      }
    })();
  }, [connected, getAvailablePurchases, setLastError]);

  useEffect(() => {
    applyPremiumFromPurchases(availablePurchases);
  }, [availablePurchases, applyPremiumFromPurchases]);

  return null;
}

export function IapProvider({ children }: { children: React.ReactNode }) {
  const [premiumUnlocked, setPremiumUnlockedState] = useState(getPremiumUnlocked);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const [billingHostReady, setBillingHostReady] = useState(false);
  const [, bump] = useState(0);
  const doBump = useCallback(() => bump((x) => x + 1), []);

  const billingRef = useRef<BillingApisPatch>(emptyBillingApis());
  const finishTransactionRef = useRef<
    ((args: { purchase: Purchase; isConsumable?: boolean | null }) => Promise<void>) | null
  >(null);

  const applyPremiumFromPurchases = useCallback((purchases: Purchase[]) => {
    const entitled = purchases.some((p) => isPremiumInAppProductId(p.productId));
    if (!entitled) {
      return;
    }
    if (!getPremiumUnlocked()) {
      setPremiumUnlocked(true);
    }
    setPremiumUnlockedState(true);
  }, []);

  useEffect(() => {
    setPremiumUnlockedState(getPremiumUnlocked());
    return subscribePremiumUnlockedChange(() => {
      setPremiumUnlockedState(getPremiumUnlocked());
    });
  }, []);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      setBillingHostReady(true);
    });
    return () => {
      if (typeof handle?.cancel === 'function') {
        handle.cancel();
      }
    };
  }, []);

  const purchasePremium = useCallback(async () => {
    const b = billingRef.current;
    if (!b.connected) {
      setLastError('스토어에 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setLastError(null);
    setPurchaseBusy(true);
    const sku = PREMIUM_SKUS[0];
    try {
      await b.requestPurchase({
        type: 'in-app',
        request: {
          google: { skus: [sku] },
          apple: { sku },
        },
      });
    } catch (e) {
      setPurchaseBusy(false);
      setLastError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const restorePremium = useCallback(async () => {
    const b = billingRef.current;
    if (!b.connected) {
      setLastError('스토어에 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setLastError(null);
    setRestoreBusy(true);
    try {
      await b.restorePurchases();
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoreBusy(false);
    }
  }, []);

  const clearLastError = useCallback(() => {
    setLastError(null);
  }, []);

  const resetLocalPremiumForTesting = useCallback(() => {
    setPremiumUnlocked(false);
    setPremiumUnlockedState(false);
  }, []);

  const patch = billingRef.current;
  const value = useMemo<IapContextValue>(
    () => ({
      premiumUnlocked,
      iapReady: patch.connected,
      premiumDisplayPrice: patch.premiumDisplayPrice,
      purchasePremium,
      restorePremium,
      purchaseBusy,
      restoreBusy,
      lastError,
      clearLastError,
      resetLocalPremiumForTesting,
    }),
    [
      premiumUnlocked,
      patch.connected,
      patch.premiumDisplayPrice,
      purchasePremium,
      restorePremium,
      purchaseBusy,
      restoreBusy,
      lastError,
      clearLastError,
      resetLocalPremiumForTesting,
    ]
  );

  return (
    <IapContext.Provider value={value}>
      {billingHostReady ? (
        <IapBillingConnection
          billingRef={billingRef}
          finishTransactionRef={finishTransactionRef}
          applyPremiumFromPurchases={applyPremiumFromPurchases}
          setPremiumUnlockedState={setPremiumUnlockedState}
          bump={doBump}
          setPurchaseBusy={setPurchaseBusy}
          setLastError={setLastError}
        />
      ) : null}
      {children}
    </IapContext.Provider>
  );
}
