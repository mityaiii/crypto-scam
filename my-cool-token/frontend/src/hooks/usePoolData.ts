import { useCallback, useEffect, useState } from "react";
import { liquidityPool, lpToken, myCoolToken } from "../lib/contracts";
import type { BalancesState } from "../types/pool";

type UsePoolDataParams = {
  address: string | null;
  setStatus: (value: string) => void;
};

export const usePoolData = ({ address, setStatus }: UsePoolDataParams) => {
  const [balances, setBalances] = useState<BalancesState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(
    async (currentAddress: string) => {
      try {
        setIsLoading(true);
        setStatus("Читаю данные из сети...");

        const [tokenBalance, lpBalance, reserves] = await Promise.all([
          myCoolToken.balance({ id: currentAddress }),
          lpToken.balance({ id: currentAddress }),
          liquidityPool.get_reserves(),
        ]);

        setBalances({
          myCoolToken: String(tokenBalance.result),
          lpToken: String(lpBalance.result),
          reserveTrade: String(reserves.result[0]),
          reserveXlm: String(reserves.result[1]),
        });

        setStatus("Данные загружены");
      } catch (error) {
        console.error(error);
        setStatus("Не удалось прочитать данные контракта");
      } finally {
        setIsLoading(false);
      }
    },
    [setStatus]
  );

  useEffect(() => {
    if (!address) {
      setBalances(null);
      return;
    }

    void loadData(address);
  }, [address, loadData]);

  const reloadData = useCallback(async () => {
    if (!address) return;
    await loadData(address);
  }, [address, loadData]);

  return {
    balances,
    isLoading,
    reloadData,
  };
};