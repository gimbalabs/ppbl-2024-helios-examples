import {
  BlockfrostV0,
  NetworkParams,
  NetworkEmulator,
  SimpleWallet,
  RootPrivateKey,
  config,
} from "@hyperionbt/helios";

import preprod from "../config/preprod.json";
import { configEnv } from "../src/config";

// Define the Cardano Network
export const network = "preprod";
config.set({ ...config, IS_TESTNET: true });

// Optimization flag for Helios compiler
export const optimize = false;

// Create Client
export let client: NetworkEmulator | BlockfrostV0;
if (configEnv.USE_EMULATOR === 'true') {
  client = new NetworkEmulator();
} else {
  client = new BlockfrostV0("preprod", configEnv.BLOCKFROST_API_KEY || "");
}

// Read in the network parameter file
export const networkParams = new NetworkParams(preprod);

// Create a wallet
export let wallet: SimpleWallet;
if (configEnv.USE_EMULATOR === 'true') {
  // Create a Wallet - we add 10ADA to start
  wallet = (client as NetworkEmulator).createWallet(10_000_000n);
  (client as NetworkEmulator).tick(10n);
} else {
  const entropy = configEnv.WALLET_ENTROPY || "";
  const rootKey = RootPrivateKey.fromPhrase(entropy.split(" "));
  const privateKey = rootKey.deriveSpendingKey();
  wallet = new SimpleWallet(client, privateKey);
  console.log("Wallet address: ", wallet.address.toBech32());
}
