import {
  BASE_FEE,
  Contract,
  Networks,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { rpc as StellarRpc } from "@stellar/stellar-sdk";
import { env } from "../config/env";
import { signTransactionXdr } from "./wallet";

const server = new StellarRpc.Server(env.rpcUrl);

function getNetworkPassphrase(): string {
  return env.networkPassphrase || Networks.TESTNET;
}

export async function quoteTokenForXlm(
  userAddress: string,
  tradeIn: string,
): Promise<string> {
  const account = await server.getAccount(userAddress);
  const contract = new Contract(env.poolId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      contract.call(
        "quote_token_for_xlm",
        nativeToScVal(tradeIn, { type: "i128" }),
      ),
    )
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (StellarRpc.Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  }

  const retval = simulated.result?.retval;
  if (!retval) {
    throw new Error("Пустой результат симуляции");
  }

  return String(scValToNative(retval));
}

export async function quoteXlmForToken(
  userAddress: string,
  xlmIn: string,
): Promise<string> {
  const account = await server.getAccount(userAddress);
  const contract = new Contract(env.poolId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      contract.call(
        "quote_xlm_for_token",
        nativeToScVal(xlmIn, { type: "i128" }),
      ),
    )
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (StellarRpc.Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  }

  const retval = simulated.result?.retval;
  if (!retval) {
    throw new Error("Пустой результат симуляции");
  }

  return String(scValToNative(retval));
}

async function invokePoolWrite(params: {
  userAddress: string;
  method:
    | "swap_token_for_xlm"
    | "add_liquidity"
    | "remove_liquidity";
  args: unknown[];
}): Promise<{ hash: string; returnValue: string | null }> {
  const { userAddress, method, args } = params;

  const account = await server.getAccount(userAddress);
  const contract = new Contract(env.poolId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      contract.call(
        method,
        ...args.map((arg) => {
          if (typeof arg === "string" && arg.startsWith("G")) {
            return nativeToScVal(arg, { type: "address" });
          }

          return nativeToScVal(String(arg), { type: "i128" });
        }),
      ),
    )
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);

  const signedXdr = await signTransactionXdr(
    preparedTx.toEnvelope().toXDR("base64"),
    userAddress,
  );

  const signedTx = TransactionBuilder.fromXDR(
    signedXdr,
    getNetworkPassphrase(),
  ) as Transaction;

  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status !== "PENDING" && sendResult.status !== "DUPLICATE") {
    throw new Error(`Не удалось отправить транзакцию. status=${sendResult.status}`);
  }

  const txResult = await waitForTransaction(sendResult.hash);

  if (txResult.status !== "SUCCESS") {
    throw new Error(`Транзакция завершилась со статусом ${txResult.status}`);
  }

  const returnValue = txResult.returnValue
    ? String(scValToNative(txResult.returnValue))
    : null;

  return {
    hash: sendResult.hash,
    returnValue,
  };
}

export async function swapTokenForXlm(params: {
  userAddress: string;
  tradeIn: string;
  minXlmOut: string;
}): Promise<{ hash: string; returnValue: string | null }> {
  const { userAddress, tradeIn, minXlmOut } = params;

  return invokePoolWrite({
    userAddress,
    method: "swap_token_for_xlm",
    args: [userAddress, tradeIn, minXlmOut],
  });
}

export async function addLiquidity(params: {
  userAddress: string;
  tradeAmount: string;
  xlmAmount: string;
  minLpOut: string;
}): Promise<{ hash: string; returnValue: string | null }> {
  const { userAddress, tradeAmount, xlmAmount, minLpOut } = params;

  return invokePoolWrite({
    userAddress,
    method: "add_liquidity",
    args: [userAddress, tradeAmount, xlmAmount, minLpOut],
  });
}

export async function removeLiquidity(params: {
  userAddress: string;
  lpAmount: string;
  minTradeOut: string;
  minXlmOut: string;
}): Promise<{ hash: string; returnValue: string | null }> {
  const { userAddress, lpAmount, minTradeOut, minXlmOut } = params;

  return invokePoolWrite({
    userAddress,
    method: "remove_liquidity",
    args: [userAddress, lpAmount, minTradeOut, minXlmOut],
  });
}

async function waitForTransaction(hash: string) {
  while (true) {
    const result = await server.getTransaction(hash);

    if (result.status === "NOT_FOUND") {
      await sleep(1000);
      continue;
    }

    return result;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}