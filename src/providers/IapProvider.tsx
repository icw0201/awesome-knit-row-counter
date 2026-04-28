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

type IapContextValue = {
  premiumUnlocked: boolean;
  /** Billing 연결 및 initConnection 성공 */
  iapReady: boolean;
  /** 스토어에서 가져온 표시 가격 (없으면 null) */
  premiumDisplayPrice: string | null;
  purchasePremium: () => Promise<void>;
  restorePremium: () => Promise<void>;
  purchaseBusy: boolean;
  restoreBusy: boolean;
  lastError: string | null;
  clearLastError: () => void;
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

export function IapProvider({ children }: { children: React.ReactNode }) {
  const [premiumUnlocked, setPremiumUnlockedState] = useState(getPremiumUnlocked);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

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
    []
  );

  const onPurchaseError = useCallback((error: PurchaseError) => {
    setPurchaseBusy(false);
    if (isUserCancelledError(error)) {
      return;
    }
    setLastError(error.message);
  }, []);

  const onError = useCallback((error: Error) => {
    setLastError(error.message);
  }, []);

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
  }, [finishTransaction]);

  useEffect(() => {
    setPremiumUnlockedState(getPremiumUnlocked());
    return subscribePremiumUnlockedChange(() => {
      setPremiumUnlockedState(getPremiumUnlocked());
    });
  }, []);

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
      } catch {
        // onError에서 처리
      }
    })();
  }, [connected, getAvailablePurchases]);

  useEffect(() => {
    applyPremiumFromPurchases(availablePurchases);
  }, [availablePurchases, applyPremiumFromPurchases]);

  const premiumProduct = useMemo(
    () => products.find((p) => isPremiumInAppProductId(p.id)),
    [products]
  );

  const premiumDisplayPrice = premiumProduct?.displayPrice ?? null;

  const purchasePremium = useCallback(async () => {
    if (!connected) {
      setLastError('스토어에 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setLastError(null);
    setPurchaseBusy(true);
    const sku = PREMIUM_SKUS[0];
    try {
      await requestPurchase({
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
  }, [connected, requestPurchase]);

  const restorePremium = useCallback(async () => {
    setLastError(null);
    setRestoreBusy(true);
    try {
      await restorePurchases();
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoreBusy(false);
    }
  }, [restorePurchases]);

  const clearLastError = useCallback(() => {
    setLastError(null);
  }, []);

  const value = useMemo<IapContextValue>(
    () => ({
      premiumUnlocked,
      iapReady: connected,
      premiumDisplayPrice,
      purchasePremium,
      restorePremium,
      purchaseBusy,
      restoreBusy,
      lastError,
      clearLastError,
    }),
    [
      premiumUnlocked,
      connected,
      premiumDisplayPrice,
      purchasePremium,
      restorePremium,
      purchaseBusy,
      restoreBusy,
      lastError,
      clearLastError,
    ]
  );

  return <IapContext.Provider value={value}>{children}</IapContext.Provider>;
}
