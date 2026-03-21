import { useMemo } from "react";

type WalletCardProps = {
  status: string;
  address: string | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isLoading: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onReload: () => Promise<void>;
};

export const WalletCard = ({
  status,
  address,
  isConnecting,
  isDisconnecting,
  isLoading,
  onConnect,
  onDisconnect,
  onReload,
}: WalletCardProps) => {
  const shortAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }, [address]);

  return (
    <div className="card">
      <h1>MyCoolToken / XLM Pool</h1>
      <p>{status}</p>

      <div className="row">
        {!address ? (
          <button
            className="primary"
            onClick={() => void onConnect()}
            disabled={isConnecting}
            type="button"
          >
            {isConnecting ? "Подключение..." : "Подключить кошелек"}
          </button>
        ) : (
          <button
            className="danger"
            onClick={() => void onDisconnect()}
            disabled={isDisconnecting}
            type="button"
          >
            {isDisconnecting ? "Отвязка..." : "Отвязать кошелек"}
          </button>
        )}

        <button
          className="secondary"
          onClick={() => void onReload()}
          disabled={!address || isLoading}
          type="button"
        >
          {isLoading ? "Обновление..." : "Обновить данные"}
        </button>
      </div>

      {address && (
        <>
          <p>
            <strong>Адрес:</strong> <span className="mono">{address}</span>
          </p>
          <p>
            <strong>Короткий адрес:</strong> {shortAddress}
          </p>
        </>
      )}
    </div>
  );
};