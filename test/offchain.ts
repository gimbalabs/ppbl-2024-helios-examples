import {
  Address,
  Assets,
  Datum,
  hexToBytes,
  Program,
  TxOutput,
  Tx,
  textToBytes,
  Value,
  WalletHelper,
} from "@hyperionbt/helios";

import { ReturnType } from "./types";
import { client, networkParams, optimize, wallet } from "./client";
import { readFileSync } from "fs";

// Load in the helios programs
const mintValidator = readFileSync("./contracts/one-shot.hl").toString();
const faucetSrc = readFileSync("./contracts/faucet.hl").toString();

// Global constants
const minAda = 2_000_000n;
const minAdaVal = new Value(minAda);

/** @internal */
type MintArgs = {
  tokenName: string;
  tokenQty: bigint;
};

export async function mint({
  tokenName,
  tokenQty,
}: MintArgs): Promise<ReturnType> {
  try {
    const walletHelper = new WalletHelper(wallet);

    // Get wallet UTXOs
    const utxos = await walletHelper.pickUtxos(minAdaVal);

    // Get change address
    const changeAddr = await walletHelper.changeAddress;

    // Start building the transaction
    const tx = new Tx();

    // Add the UTXO as inputs
    tx.addInputs(utxos[0]);

    const mintProgram = Program.new(mintValidator);
    mintProgram.parameters = { ["TX_ID"]: utxos[0][0].outputId.txId.hex };
    mintProgram.parameters = { ["TX_IDX"]: utxos[0][0].outputId.utxoIdx };
    const mintCompiled = mintProgram.compile(optimize);

    // Add the script as a witness to the transaction
    tx.attachScript(mintCompiled);

    // Create the minting claim redeemer
    const mintRedeemer = new mintProgram.types.Redeemer.Mint(
      textToBytes(tokenName),
      tokenQty,
    )._toUplcData();

    // Create the minted tokens
    const tokens = [[textToBytes(tokenName), tokenQty]] as [[number[], bigint]];

    // Create the minted assets
    const assets = new Assets([[mintCompiled.mintingPolicyHash, tokens]]);

    // Add the new minted token to the transaction which includes
    // the minting policy hash, the token name, amount and the redeemer
    tx.mintTokens(mintCompiled.mintingPolicyHash, tokens, mintRedeemer);

    // Construct the output to send the minAda
    // and the inline datum to the script address
    tx.addOutput(
      new TxOutput(wallet.address, new Value(minAdaVal.lovelace, assets)),
    );

    // Send any change back to the buyer
    await tx.finalize(networkParams, changeAddr, utxos[1]);

    // Sign the unsigned tx to get the witness
    const signatures = await wallet.signTx(tx);
    tx.addSignatures(signatures);

    // Submit the signed tx
    const txHash = await wallet.submitTx(tx);

    return {
      status: 200,
      txName: "Mint",
      txId: txHash.hex,
      tokenNameHex: Buffer.from(tokenName).toString("hex"),
      mintingPolicy: mintCompiled.mintingPolicyHash.toString(),
      cpu: tx.witnesses.redeemers[0].cpuCost,
      mem: tx.witnesses.redeemers[0].memCost,
      fee: tx.body.fee,
    } as ReturnType;
  } catch (err) {
    return {
      status: 400,
      msg: "Mint tx failed: " + err,
    } as ReturnType;
  }
}

/** @internal */
type LockArgs = {
  withdrawalAmount: bigint;
  faucetLockedAmount: bigint;
  faucetTokenNameHex: string;
  faucetTokenPolicy: string;
  accessTokenPolicy: string;
};

export async function lock({
  withdrawalAmount,
  faucetLockedAmount,
  faucetTokenNameHex,
  faucetTokenPolicy,
  accessTokenPolicy,
}: LockArgs): Promise<ReturnType> {
  try {
    const walletHelper = new WalletHelper(wallet);
    const assets = new Assets([
      [
        faucetTokenPolicy,
        [[hexToBytes(faucetTokenNameHex), faucetLockedAmount]],
      ],
    ]);
    const lockFaucetVal = new Value(minAdaVal.lovelace, assets);

    // Get wallet UTXOs
    const utxos = await walletHelper.pickUtxos(lockFaucetVal);

    // Get change address
    const changeAddr = await walletHelper.changeAddress;

    // Start building the transaction
    const tx = new Tx();

    // Add the UTXO as inputs
    tx.addInputs(utxos[0]);

    const faucetProgram = Program.new(faucetSrc);
    faucetProgram.parameters = { ["ACCESS_TOKEN_SYMBOL"]: accessTokenPolicy };
    faucetProgram.parameters = { ["FAUCET_TOKEN_SYMBOL"]: faucetTokenPolicy };
    const faucetCompiled = faucetProgram.compile(optimize);

    // Construct the vesting datum
    const faucetDatum = new faucetProgram.types.Datum(
      withdrawalAmount,
      faucetTokenNameHex,
    );

    // Construct the output to send the minAda
    // and the inline datum to the script address
    tx.addOutput(
      new TxOutput(
        Address.fromHashes(faucetCompiled.validatorHash),
        lockFaucetVal,
        Datum.inline(faucetDatum),
      ),
    );

    // Send any change back to the buyer
    await tx.finalize(networkParams, changeAddr, utxos[1]);

    // Sign the unsigned tx to get the witness
    const signatures = await wallet.signTx(tx);
    tx.addSignatures(signatures);

    // Submit the signed tx
    const txHash = await wallet.submitTx(tx);

    return {
      status: 200,
      txName: "Lock",
      txId: txHash.hex,
      fee: tx.body.fee,
    } as ReturnType;
  } catch (err) {
    return {
      status: 400,
      msg: "Lock tx failed: " + err,
    } as ReturnType;
  }
}

/** @internal */
type WithdrawArgs = {
  withdrawalAmount: bigint;
  faucetTokenNameHex: string;
  faucetTokenPolicy: string;
  accessTokenNameHex: string;
  accessTokenPolicy: string;
};
export async function withdraw({
  withdrawalAmount,
  faucetTokenNameHex,
  faucetTokenPolicy,
  accessTokenNameHex,
  accessTokenPolicy,
}: WithdrawArgs): Promise<ReturnType> {
  try {
    const walletHelper = new WalletHelper(wallet);
    const withdrawlAssets = new Assets([
      [faucetTokenPolicy, [[hexToBytes(faucetTokenNameHex), withdrawalAmount]]],
    ]);
    const withdrawFaucetVal = new Value(0n, withdrawlAssets);

    // Create the access token assets
    const accessTokenAssets = new Assets([
      [accessTokenPolicy, [[hexToBytes(accessTokenNameHex), 1n]]],
    ]);
    const accessTokenVal = new Value(0n, accessTokenAssets);

    // Get wallet UTXOs
    const utxos = await walletHelper.pickUtxos(accessTokenVal);

    // Get change address
    const changeAddr = await walletHelper.changeAddress;

    // Start building the transaction
    const tx = new Tx();

    // Add the UTXO as inputs
    tx.addInputs(utxos[0]);

    const faucetProgram = Program.new(faucetSrc);
    faucetProgram.parameters = { ["ACCESS_TOKEN_SYMBOL"]: accessTokenPolicy };
    faucetProgram.parameters = { ["FAUCET_TOKEN_SYMBOL"]: faucetTokenPolicy };
    const faucetCompiled = faucetProgram.compile(optimize);

    // Add the script as a witness to the transaction
    tx.attachScript(faucetCompiled);

    // Create the faucet claim redeemer
    const faucetRedeemer = new faucetProgram.types.Redeemer.Withdraw(
      wallet.pubKeyHash,
      accessTokenNameHex,
    )._toUplcData();

    // Construct the faucet datum
    const faucetDatum = new faucetProgram.types.Datum(
      withdrawalAmount,
      faucetTokenNameHex,
    );

    // Get the UTXO locked at the faucet contract
    let currentFaucetAmount = 0n;
    const faucetUtxo = await client
      .getUtxos(Address.fromHashes(faucetCompiled.validatorHash))
      .then((utxos) => {
        return utxos.find((utxo) => {
          if (
            utxo.origOutput.datum?.hash.hex ===
            Datum.inline(faucetDatum).hash.hex
          ) {
            currentFaucetAmount = utxo.origOutput.value.assets.get(
              faucetTokenPolicy,
              hexToBytes(faucetTokenNameHex),
            );
            return utxo;
          }
        });
      });

    // Check that UTXO input exists
    if (faucetUtxo) {
      tx.addInput(faucetUtxo, faucetRedeemer);
    } else {
      throw console.error(
        "No UTXOs found at vesting contract address: ",
        Address.fromHashes(faucetCompiled.validatorHash).toBech32(),
      );
    }

    // Calculate the remaing faucet amount
    const remainingFaucetAmount = currentFaucetAmount - withdrawalAmount;
    const remainingFaucetAssets = new Assets([
      [
        faucetTokenPolicy,
        [[hexToBytes(faucetTokenNameHex), remainingFaucetAmount]],
      ],
    ]);
    const remainingFaucetVal = new Value(
      minAdaVal.lovelace,
      remainingFaucetAssets,
    );

    // Construct the output to send the remaining faucet amount
    tx.addOutput(
      new TxOutput(
        Address.fromHashes(faucetCompiled.validatorHash),
        remainingFaucetVal,
        Datum.inline(faucetDatum),
      ),
    );

    // Construct the output to send the withdrawal amount
    tx.addOutput(
      new TxOutput(wallet.address, withdrawFaucetVal.add(accessTokenVal)),
    );

    // Send any change back to the buyer
    await tx.finalize(networkParams, changeAddr, utxos[1]);

    // Sign the unsigned tx to get the witness
    const signatures = await wallet.signTx(tx);
    tx.addSignatures(signatures);

    // Submit the signed tx
    const txHash = await wallet.submitTx(tx);

    return {
      status: 200,
      txName: "Withdraw",
      txId: txHash.hex,
      cpu: tx.witnesses.redeemers[0].cpuCost,
      mem: tx.witnesses.redeemers[0].memCost,
      fee: tx.body.fee,
    } as ReturnType;
  } catch (err) {
    return {
      status: 400,
      msg: "Withdraw tx failed: " + err,
    } as ReturnType;
  }
}
