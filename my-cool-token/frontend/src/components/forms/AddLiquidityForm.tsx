import { type SubmitEvent, useMemo, useState } from "react";
import { addLiquidity } from "../../lib/soroban";

type AddLiquidityFormProps = {
  address: string;
  onSuccess?: () => Promise<void> | void;
};

export default function AddLiquidityForm({
  address,
  onSuccess,
}: AddLiquidityFormProps) {
  const [tradeAmount, setTradeAmount] = useState("1000000");
  const [xlmAmount, setXlmAmount] = useState("200000");
  const [minLpOut, setMinLpOut] = useState("1");
  const [status, setStatus] = useState("Готово");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txReturnValue, setTxReturnValue] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      Number(tradeAmount) > 0 &&
      Number(xlmAmount) > 0 &&
      Number(minLpOut) >= 0 &&
      !isSubmitting
    );
  }, [tradeAmount, xlmAmount, minLpOut, isSubmitting]);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setStatus("Подписываю и отправляю add_liquidity...");
      setTxHash(null);
      setTxReturnValue(null);

      const result = await addLiquidity({
        userAddress: address,
        tradeAmount,
        xlmAmount,
        minLpOut,
      });

      setTxHash(result.hash);
      setTxReturnValue(result.returnValue);
      setStatus("Ликвидность успешно добавлена");

      await onSuccess?.();
    } catch (error) {
      console.error(error);
      setStatus("Не удалось добавить ликвидность");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Add Liquidity</h2>
      <p className="muted">Добавление MyCoolToken и XLM в пул</p>

      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div>
            <label htmlFor="tradeAmount">trade_amount</label>
            <input
              id="tradeAmount"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label htmlFor="xlmAmount">xlm_amount</label>
            <input
              id="xlmAmount"
              value={xlmAmount}
              onChange={(e) => setXlmAmount(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" }}
            />
          </div>

          <div>
            <label htmlFor="minLpOut">min_lp_out</label>
            <input
              id="minLpOut"
              value={minLpOut}
              onChange={(e) => setMinLpOut(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" }}
            />
          </div>
        </div>

        <div className="row" style={{ alignItems: "end" }}>
          <button className="primary" type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Добавление..." : "Add Liquidity"}
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