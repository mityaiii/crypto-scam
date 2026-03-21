import type { ActiveTab } from "../../types/pool";

type PoolActionsCardProps = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
};

export const PoolActionsCard = ({
  activeTab,
  onTabChange,
}: PoolActionsCardProps) => {
  return (
    <div className="card">
      <h2>Действия</h2>

      <div className="tab-row">
        <button
          className={activeTab === "swap" ? "tab-button active" : "tab-button"}
          onClick={() => onTabChange("swap")}
          type="button"
        >
          Swap Token → XLM
        </button>

        <button
          className={activeTab === "add" ? "tab-button active" : "tab-button"}
          onClick={() => onTabChange("add")}
          type="button"
        >
          Add Liquidity
        </button>

        <button
          className={activeTab === "remove" ? "tab-button active" : "tab-button"}
          onClick={() => onTabChange("remove")}
          type="button"
        >
          Remove Liquidity
        </button>
      </div>
    </div>
  );
};