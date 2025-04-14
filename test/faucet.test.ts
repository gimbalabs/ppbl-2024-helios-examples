import { hexToBytes, NetworkEmulator, Value } from "@hyperionbt/helios";
import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  describe,
  expect,
  test,
} from "vitest";

import { lock, mint, withdraw } from "./offchain";
import { client, emulator, wallet } from "./client";
import { ReturnType } from "./types";
import { generateReport } from "./utils";

describe("Faucet", () => {
  let exCosts = [] as ReturnType[];
  let accessTokenNameHex: string = process.env.ACCESS_TOKEN_NAME_HEX || "";
  let accessTokenPolicy: string = process.env.ACCESS_TOKEN_POLICY || "";
  let faucetTokenNameHex: string = process.env.FAUCET_TOKEN_NAME_HEX || "";
  let faucetTokenPolicy: string = process.env.FAUCET_TOKEN_POLICY || "";

  const withdrawalAmount = 100n;
  const faucetLockedAmount = 1000000n;

  // Setup code that runs once before all tests
  beforeAll(async () => {
    console.log("E2E Faucet Test - START");
  });

  // Cleanup code that runs once after all tests
  afterAll(async () => {
    //console.log(client.dump());
    generateReport(exCosts);
    console.log("E2E Faucet Test - END");
  });

  afterEach(async () => {
    if (emulator && "tick" in client) {
      (client as NetworkEmulator).tick(10n);
    }
  });

  test("Mint Access Token", async () => {
    console.log("\n--- Before Mint Access Token Tx ---");

    const result = await mint({
      tokenName: "access-token",
      tokenQty: 1n,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);

    accessTokenNameHex = result.tokenNameHex ?? "";
    accessTokenPolicy = result.mintingPolicy ?? "";
    console.log("\n--- After Mint Access Token Tx ---");
  }, 1000000);

  test("Mint Faucet Token", async () => {
    console.log("\n--- Before Mint Faucet Token Tx ---");

    const result = await mint({
      tokenName: "faucet-token",
      tokenQty: 1000000n,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);

    faucetTokenNameHex = result.tokenNameHex ?? "";
    faucetTokenPolicy = result.mintingPolicy ?? "";
    console.log("\n--- After Mint Faucet Token Tx ---");
  }, 1000000);

  test("Lock Faucet Token", async () => {
    console.log("\n--- Before Lock Faucet Token Tx ---");

    const result = await lock({
      withdrawalAmount,
      faucetLockedAmount,
      faucetTokenNameHex,
      faucetTokenPolicy,
      accessTokenPolicy,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);
    console.log("\n--- After Lock Faucet Token Tx ---");
  }, 1000000);

  test("Withdraw Faucet Token 1", async () => {
    console.log("\n--- Before Withdraw Faucet Token Tx ---");

    const result = await withdraw({
      withdrawalAmount,
      faucetTokenNameHex,
      faucetTokenPolicy,
      accessTokenNameHex,
      accessTokenPolicy,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);
    console.log("\n--- After Withdraw Faucet Token Tx ---");
  }, 1000000);

  test("Withdraw Faucet Token 2", async () => {
    console.log("\n--- Before Withdraw Faucet Token Tx ---");

    const result = await withdraw({
      withdrawalAmount,
      faucetTokenNameHex,
      faucetTokenPolicy,
      accessTokenNameHex,
      accessTokenPolicy,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);
    console.log("\n--- After Withdraw Faucet Token Tx ---");
  }, 1000000);

  test("Check Wallet Balance", async () => {
    const walletUtxosEnd = await client.getUtxos(wallet.address);
    const walletValueEnd = walletUtxosEnd.reduce(
      (amount, utxo) => amount.add(utxo.output.value),
      new Value(0n),
    );
    assert(
      walletValueEnd.assets.get(
        accessTokenPolicy,
        hexToBytes(accessTokenNameHex),
      ) == 1n,
    );
    assert(
      walletValueEnd.assets.get(
        faucetTokenPolicy,
        hexToBytes(faucetTokenNameHex),
      ) == 200n,
    );
  }, 1000000);
});
