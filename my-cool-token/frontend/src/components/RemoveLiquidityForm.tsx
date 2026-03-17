import { type FormEvent, useMemo, useState } from "react";
import { removeLiquidity } from "../lib/soroban";

type RemoveLiquidityFormProps = {
  address: string;
  onSuccess?: () => Promise<void> | void;
};

export default function RemoveLiquidityForm({
  address,
  onSuccess,
}: RemoveLiquidityFormProps) {
  const [lpAmount, setLpAmount] = useState("1000");
  const [minTradeOut, setMinTradeOut] = useState("1");
  const [minXlmOut, setMinXlmOut] = useState("1");
  const [status, setStatus] = useState("Готово");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txReturnValue, setTxReturnValue] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      Number(lpAmount) > 0 &&
      Number(minTradeOut) >= 0 &&
      Number(minXlmOut) >= 0 &&
      !isSubmitting
    );
  }, [lpAmount, minTradeOut, minXlmOut, isSubmitting]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setStatus("Подписываю и отправляю remove_liquidity...");
      setTxHash(null);
      setTxReturnValue(null);

      const result = await removeLiquidity({
        userAddress: address,
        lpAmount,
        minTradeOut,
        minXlmOut,
      });

      setTxHash(result.hash);
      setTxReturnValue(result.returnValue);
      setStatus("Ликвидность успешно удалена");

      await onSuccess?.();
    } catch (error) {
      console.error(error);
      setStatus("Не удалось удалить ликвидность");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Remove Liquidity</h2>
      <p className="muted">Сжигание LP token и возврат активов из пула</p>

      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div>
            <label htmlFor="lpAmount">lp_amount</label>
            <input
              id="lpAmount"
              value={lpAmount}
              onChange={(e) => setLpAmount(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label htmlFor="minTradeOut">min_trade_out</label>
            <input
              id="minTradeOut"
              value={minTradeOut}
              onChange={(e) => setMinTradeOut(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label htmlFor="minXlmOut">min_xlm_out</label>
            <input
              id="minXlmOut"
              value={minXlmOut}
              onChange={(e) => setMinXlmOut(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="primary" type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Удаление..." : "Remove Liquidity"}
          </button>
        </div>
      </form>

      <p>{status}</p>

      {txReturnValue && (
        <p>
          <strong>Return value:</strong> {txReturnValue}
        </p>
      )}

      {txHash && (
        <p className="mono">
          <strong>Tx hash:</strong> {txHash}
        </p>
      )}
    </div>
  );
}