import type { BalancesState } from "../../types/pool";

type BalancesCardProps = {
  balances: BalancesState | null;
};

export const BalanceCard = ({ balances }: BalancesCardProps) => {
  return (
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
  );
};