import { useState } from "react";
import type { ActiveTab } from "../types/pool";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { usePoolData } from "../hooks/usePoolData";
import { WalletCard } from "../components/pool/WalletCard";
import { BalanceCard } from "../components/pool/BalanceCard";
import { PoolActionsCard } from "../components/pool/PoolActionsCard";
import SwapForm from "../components/forms/SwapForm";
import AddLiquidityForm from "../components/forms/AddLiquidityForm";
import RemoveLiquidityForm from "../components/forms/RemoveLiquidityForm";
import "./styles.css";

export const MainPage = () => {
  const [status, setStatus] = useState("Кошелек не подключен");
  const [activeTab, setActiveTab] = useState<ActiveTab>("swap");

  const {
    address,
    isConnecting,
    isDisconnecting,
    handleConnect,
    handleDisconnect,
  } = useWalletConnection({
    setStatus,
  });

  const { balances, isLoading, reloadData } = usePoolData({
    address,
    setStatus,
  });

  const renderActiveForm = () => {
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
  };

  return (
    <div className="app">
      <WalletCard
        status={status}
        address={address}
        isConnecting={isConnecting}
        isDisconnecting={isDisconnecting}
        isLoading={isLoading}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onReload={reloadData}
      />

      <BalanceCard balances={balances} />

      {address && (
        <>
          <PoolActionsCard
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {renderActiveForm()}
        </>
      )}
    </div>
  );
};