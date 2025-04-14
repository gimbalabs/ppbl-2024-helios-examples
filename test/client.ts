import {
  BlockfrostV0,
  NetworkParams,
  NetworkEmulator,
  SimpleWallet,
  RootPrivateKey,
  config,
} from "@hyperionbt/helios";

import preprod from "../config/preprod.json";

// Emulator flag
export const emulator = true;

// Define the Cardano Network
export const network = "preprod";
config.set({ ...config, IS_TESTNET: true });

// Optimization flag for Helios compiler
export const optimize = false;

// Create Client
export let client: NetworkEmulator | BlockfrostV0;
if (emulator) {
  client = new NetworkEmulator();
} else {
  client = new BlockfrostV0("preprod", process.env.BLOCKFROST_API_KEY || "");
}

// Read in the network parameter file
export const networkParams = new NetworkParams(preprod);

// Create a wallet
export let wallet: SimpleWallet;
if (emulator) {
  // Create a Wallet - we add 10ADA to start
  wallet = (client as NetworkEmulator).createWallet(10_000_000n);
  (client as NetworkEmulator).tick(10n);
} else {
  const entropy =
    "ridge cereal poet happy borrow melody fashion donor amateur calm erupt horror traffic onion crack brick cycle dawn wall thing census parent bachelor next";
  const rootKey = RootPrivateKey.fromPhrase(entropy.split(" "));
  const privateKey = rootKey.deriveSpendingKey();
  wallet = new SimpleWallet(client, privateKey);
  console.log("Wallet created");
  console.log(wallet.address.toBech32());
}
