import { type FormEvent, useMemo, useState } from "react";
import { quoteTokenForXlm, swapTokenForXlm } from "../lib/soroban";

type SwapFormProps = {
  address: string;
  onSuccess?: () => Promise<void> | void;
};

export default function SwapForm({ address, onSuccess }: SwapFormProps) {
  const [tradeIn, setTradeIn] = useState("1000000");
  const [minXlmOut, setMinXlmOut] = useState("1");
  const [quotedOut, setQuotedOut] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txReturnValue, setTxReturnValue] = useState<string | null>(null);
  const [status, setStatus] = useState("Готово");
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const canQuote = useMemo(() => {
    return !!tradeIn && Number(tradeIn) > 0 && !isQuoting && !isSwapping;
  }, [tradeIn, isQuoting, isSwapping]);

  const canSwap = useMemo(() => {
    return (
      !!tradeIn &&
      !!minXlmOut &&
      Number(tradeIn) > 0 &&
      Number(minXlmOut) >= 0 &&
      !isQuoting &&
      !isSwapping
    );
  }, [tradeIn, minXlmOut, isQuoting, isSwapping]);

  async function handleQuote(e: FormEvent) {
    e.preventDefault();

    try {
      setIsQuoting(true);
      setStatus("Считаю quote...");
      setQuotedOut(null);

      const result = await quoteTokenForXlm(address, tradeIn);
      setQuotedOut(result);
      setStatus("Quote получен");
    } catch (error) {
      console.error(error);
      setStatus("Не удалось получить quote");
    } finally {
      setIsQuoting(false);
    }
  }

  async function handleSwap(e: FormEvent) {
    e.preventDefault();

    try {
      setIsSwapping(true);
      setStatus("Собираю и подписываю транзакцию...");
      setTxHash(null);
      setTxReturnValue(null);

      const result = await swapTokenForXlm({
        userAddress: address,
        tradeIn,
        minXlmOut,
      });

      setTxHash(result.hash);
      setTxReturnValue(result.returnValue);
      setStatus("Swap успешно выполнен");

      await onSuccess?.();
    } catch (error) {
      console.error(error);
      setStatus("Swap не удался");
    } finally {
      setIsSwapping(false);
    }
  }

  return (
    <div className="card">
      <h2>Swap Token → XLM</h2>
      <p className="muted">
        Обмен MyCoolToken на XLM через контракт пула
      </p>

      <form className="row" onSubmit={handleQuote}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="tradeIn">trade_in</label>
          <input
            id="tradeIn"
            value={tradeIn}
            onChange={(e) => setTradeIn(e.target.value)}
            placeholder="1000000"
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="minXlmOut">min_xlm_out</label>
          <input
            id="minXlmOut"
            value={minXlmOut}
            onChange={(e) => setMinXlmOut(e.target.value)}
            placeholder="1"
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" }}
          />
        </div>

        <div className="row" style={{ alignItems: "end" }}>
          <button className="secondary" type="submit" disabled={!canQuote}>
            {isQuoting ? "Quote..." : "Quote"}
          </button>

          <button
            className="primary"
            type="button"
            disabled={!canSwap}
            onClick={(e) => void handleSwap(e as unknown as FormEvent)}
          >
            {isSwapping ? "Swap..." : "Swap"}
          </button>
        </div>
      </form>

      <p>{status}</p>

      {quotedOut && (
        <p>
          <strong>Ожидаемый XLM out:</strong> {quotedOut}
        </p>
      )}

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