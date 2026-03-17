import { useEffect, useMemo, useState } from "react";
import { connectWallet, getConnectedAddress } from "./lib/wallet";
import { myCoolToken, lpToken, liquidityPool } from "./lib/contracts";
import SwapForm from "./components/SwapForm";
import AddLiquidityForm from "./components/AddLiquidityForm";
import RemoveLiquidityForm from "./components/RemoveLiquidityForm";

type BalancesState = {
  myCoolToken: string;
  lpToken: string;
  reserveTrade: string;
  reserveXlm: string;
};

type ActiveTab = "swap" | "add" | "remove";

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState("Кошелек не подключен");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState<BalancesState | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("swap");

  useEffect(() => {
    void (async () => {
      const existing = await getConnectedAddress();
      if (existing) {
        setAddress(existing);
        setStatus("Кошелек уже подключен");
      }
    })();
  }, []);

  useEffect(() => {
    if (!address) return;
    void loadData(address);
  }, [address]);

  async function loadData(currentAddress: string) {
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
  }

  async function reloadData() {
    if (!address) return;
    await loadData(address);
  }

  const shortAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }, [address]);

  async function handleConnect() {
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
  }

  function renderActiveForm() {
    if (!address) return null;

    switch (activeTab) {
      case "swap":
        return <SwapForm address={address} onSuccess={reloadData} />;
      case "add":
        return <AddLiquidityForm address={address} onSuccess={reloadData} />;
      case "remove":
        return <RemoveLiquidityForm address={address} onSuccess={reloadData} />;
      default:
        return null;
    }
  }

  return (
    <div className="app">
      <div className="card">
        <h1>MyCoolToken / XLM Pool</h1>
        <p>{status}</p>

        <div className="row">
          <button
            className="primary"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Подключение..." : "Подключить кошелек"}
          </button>

          <button
            className="secondary"
            onClick={() => void reloadData()}
            disabled={!address || isLoading}
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

      <div className="card">
        <h2>Балансы и резервы</h2>

        {!balances && <p className="muted">Пока нет данных</p>}

        {balances && (
          <div className="grid">
            <div>
              <div className="muted">MyCoolToken</div>
              <div>{balances.myCoolToken}</div>
            </div>

            <div>
              <div className="muted">LP Token</div>
              <div>{balances.lpToken}</div>
            </div>

            <div>
              <div className="muted">Reserve Trade</div>
              <div>{balances.reserveTrade}</div>
            </div>

            <div>
              <div className="muted">Reserve XLM</div>
              <div>{balances.reserveXlm}</div>
            </div>
          </div>
        )}
      </div>

      {address && (
        <>
          <div className="card">
            <h2>Действия</h2>

            <div className="tab-row">
              <button
                className={activeTab === "swap" ? "tab-button active" : "tab-button"}
                onClick={() => setActiveTab("swap")}
                type="button"
              >
                Swap Token → XLM
              </button>

              <button
                className={activeTab === "add" ? "tab-button active" : "tab-button"}
                onClick={() => setActiveTab("add")}
                type="button"
              >
                Add Liquidity
              </button>

              <button
                className={activeTab === "remove" ? "tab-button active" : "tab-button"}
                onClick={() => setActiveTab("remove")}
                type="button"
              >
                Remove Liquidity
              </button>
            </div>
          </div>

          {renderActiveForm()}
        </>
      )}
    </div>
  );
}