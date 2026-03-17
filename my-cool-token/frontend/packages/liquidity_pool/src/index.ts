import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CADI2PDG5P3KVM5VJNYU2CGQBOIZEJ3RWOI6FVFBU6RQI3Y5GXSX7ZV3",
  }
} as const

export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"InvalidAmount"},
  4: {message:"PoolEmpty"},
  5: {message:"InvalidRatio"},
  6: {message:"SlippageExceeded"},
  7: {message:"InsufficientLiquidity"},
  8: {message:"MathOverflow"},
  9: {message:"DivisionByZero"}
}

export type DataKey = {tag: "TradeToken", values: void} | {tag: "XlmToken", values: void} | {tag: "LpToken", values: void} | {tag: "ReserveTrade", values: void} | {tag: "ReserveXlm", values: void};

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  init: ({trade_token, xlm_token, lp_token}: {trade_token: string, xlm_token: string, lp_token: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_reserves transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_reserves: (options?: MethodOptions) => Promise<AssembledTransaction<readonly [i128, i128]>>

  /**
   * Construct and simulate a add_liquidity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_liquidity: ({provider, trade_amount, xlm_amount, min_lp_out}: {provider: string, trade_amount: i128, xlm_amount: i128, min_lp_out: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a remove_liquidity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  remove_liquidity: ({provider, lp_amount, min_trade_out, min_xlm_out}: {provider: string, lp_amount: i128, min_trade_out: i128, min_xlm_out: i128}, options?: MethodOptions) => Promise<AssembledTransaction<readonly [i128, i128]>>

  /**
   * Construct and simulate a swap_token_for_xlm transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  swap_token_for_xlm: ({user, trade_in, min_xlm_out}: {user: string, trade_in: i128, min_xlm_out: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a swap_xlm_for_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  swap_xlm_for_token: ({user, xlm_in, min_trade_out}: {user: string, xlm_in: i128, min_trade_out: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a quote_token_for_xlm transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  quote_token_for_xlm: ({trade_in}: {trade_in: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a quote_xlm_for_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  quote_xlm_for_token: ({xlm_in}: {xlm_in: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAEaW5pdAAAAAMAAAAAAAAAC3RyYWRlX3Rva2VuAAAAABMAAAAAAAAACXhsbV90b2tlbgAAAAAAABMAAAAAAAAACGxwX3Rva2VuAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAMZ2V0X3Jlc2VydmVzAAAAAAAAAAEAAAPtAAAAAgAAAAsAAAAL",
        "AAAAAAAAAAAAAAANYWRkX2xpcXVpZGl0eQAAAAAAAAQAAAAAAAAACHByb3ZpZGVyAAAAEwAAAAAAAAAMdHJhZGVfYW1vdW50AAAACwAAAAAAAAAKeGxtX2Ftb3VudAAAAAAACwAAAAAAAAAKbWluX2xwX291dAAAAAAACwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAQcmVtb3ZlX2xpcXVpZGl0eQAAAAQAAAAAAAAACHByb3ZpZGVyAAAAEwAAAAAAAAAJbHBfYW1vdW50AAAAAAAACwAAAAAAAAANbWluX3RyYWRlX291dAAAAAAAAAsAAAAAAAAAC21pbl94bG1fb3V0AAAAAAsAAAABAAAD7QAAAAIAAAALAAAACw==",
        "AAAAAAAAAAAAAAASc3dhcF90b2tlbl9mb3JfeGxtAAAAAAADAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAIdHJhZGVfaW4AAAALAAAAAAAAAAttaW5feGxtX291dAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAASc3dhcF94bG1fZm9yX3Rva2VuAAAAAAADAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGeGxtX2luAAAAAAALAAAAAAAAAA1taW5fdHJhZGVfb3V0AAAAAAAACwAAAAEAAAAL",
        "AAAAAAAAAAAAAAATcXVvdGVfdG9rZW5fZm9yX3hsbQAAAAABAAAAAAAAAAh0cmFkZV9pbgAAAAsAAAABAAAACw==",
        "AAAAAAAAAAAAAAATcXVvdGVfeGxtX2Zvcl90b2tlbgAAAAABAAAAAAAAAAZ4bG1faW4AAAAAAAsAAAABAAAACw==",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAACQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAMAAAAAAAAACVBvb2xFbXB0eQAAAAAAAAQAAAAAAAAADEludmFsaWRSYXRpbwAAAAUAAAAAAAAAEFNsaXBwYWdlRXhjZWVkZWQAAAAGAAAAAAAAABVJbnN1ZmZpY2llbnRMaXF1aWRpdHkAAAAAAAAHAAAAAAAAAAxNYXRoT3ZlcmZsb3cAAAAIAAAAAAAAAA5EaXZpc2lvbkJ5WmVybwAAAAAACQ==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAAClRyYWRlVG9rZW4AAAAAAAAAAAAAAAAACFhsbVRva2VuAAAAAAAAAAAAAAAHTHBUb2tlbgAAAAAAAAAAAAAAAAxSZXNlcnZlVHJhZGUAAAAAAAAAAAAAAApSZXNlcnZlWGxtAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        get_reserves: this.txFromJSON<readonly [i128, i128]>,
        add_liquidity: this.txFromJSON<i128>,
        remove_liquidity: this.txFromJSON<readonly [i128, i128]>,
        swap_token_for_xlm: this.txFromJSON<i128>,
        swap_xlm_for_token: this.txFromJSON<i128>,
        quote_token_for_xlm: this.txFromJSON<i128>,
        quote_xlm_for_token: this.txFromJSON<i128>
  }
}