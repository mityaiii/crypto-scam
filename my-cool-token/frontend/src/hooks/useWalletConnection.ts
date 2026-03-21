import { useCallback, useEffect, useState } from "react";
import { connectWallet, disconnectWallet, getConnectedAddress } from "../lib/wallet";

type UseWalletConnectionParams = {
  setStatus: (value: string) => void;
};

export const useWalletConnection = ({
  setStatus,
}: UseWalletConnectionParams) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const existing = await getConnectedAddress();
        if (existing) {
          setAddress(existing);
          setStatus("Кошелек уже подключен");
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [setStatus]);

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setStatus("Открываю выбор кошелька...");

      const walletAddress = await connectWallet();
      setAddress(walletAddress);
      setStatus("Кошелек подключен");
    } catch (error) {
      console.error(error);
      setStatus("Не удалось подключить кошелек");
    } finally {
      setIsConnecting(false);
    }
  }, [setStatus]);

  const handleDisconnect = useCallback(async () => {
    try {
      setIsDisconnecting(true);
      setStatus("Отвязываю кошелек...");

      await disconnectWallet();
      setAddress(null);
      setStatus("Кошелек отвязан");
    } catch (error) {
      console.error(error);
      setStatus("Не удалось отвязать кошелек");
    } finally {
      setIsDisconnecting(false);
    }
  }, [setStatus]);

  return {
    address,
    isConnecting,
    isDisconnecting,
    handleConnect,
    handleDisconnect,
  };
};