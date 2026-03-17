export const env = {
  rpcUrl: import.meta.env.VITE_RPC_URL as string,
  networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE as string,
  myCoolTokenId: import.meta.env.VITE_MYCOOLTOKEN_ID as string,
  lpTokenId: import.meta.env.VITE_LPTOKEN_ID as string,
  poolId: import.meta.env.VITE_POOL_ID as string,
  xlmSacId: import.meta.env.VITE_XLM_SAC_ID as string,
};

for (const [key, value] of Object.entries(env)) {
  if (!value) {
    throw new Error(`Missing env variable: ${key}`);
  }
}