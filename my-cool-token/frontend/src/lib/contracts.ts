import { env } from "../config/env";
import * as MyCoolToken from "my_cool_token";
import * as LpToken from "lp_token";
import * as LiquidityPool from "liquidity_pool";

export const myCoolToken = new MyCoolToken.Client({
  contractId: env.myCoolTokenId,
  networkPassphrase: env.networkPassphrase,
  rpcUrl: env.rpcUrl,
});

export const lpToken = new LpToken.Client({
  contractId: env.lpTokenId,
  networkPassphrase: env.networkPassphrase,
  rpcUrl: env.rpcUrl,
});

export const liquidityPool = new LiquidityPool.Client({
  contractId: env.poolId,
  networkPassphrase: env.networkPassphrase,
  rpcUrl: env.rpcUrl,
});