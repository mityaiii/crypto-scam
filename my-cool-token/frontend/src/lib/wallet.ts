import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { env } from "../config/env";

let initialized = false;

export function ensureWalletKit() {
  if (initialized) return;

  StellarWalletsKit.init({
    modules: defaultModules(),
  });

  initialized = true;
}

export async function connectWallet(): Promise<string> {
  ensureWalletKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function getConnectedAddress(): Promise<string | null> {
  ensureWalletKit();

  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address;
  } catch {
    return null;
  }
}

export async function signTransactionXdr(
  xdr: string,
  address: string,
): Promise<string> {
  ensureWalletKit();

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: env.networkPassphrase,
    address,
  });

  return signedTxXdr;
}