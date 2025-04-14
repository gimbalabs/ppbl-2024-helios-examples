# Plutus Project Based Learning 
## Testing PPBL Faucet in Helios
#### Setup
```
$ git clone https://github.com/gimbalabs/ppbl-2024-helios-examples.git
$ cd ppbl-2024-helios-examples
$ npm install
$ cp .env.example .env
```

### Runing the emulator test suite
```
$ npm test
```

### Running each test cases against a real network (eg. preprod)
You will need to fund your network wallet which uses a seed phrase (wallet entropy) defined in a .env file and also provide a Blockfrost API key.
```
WALLET_ENTROPY=
BLOCKFROST_API_KEY=
```

The first step is to mint an accesss and a faucet token, but wait until you confirm each transaction after running each test.
```
$ npm run test:network "Mint Access Token"
$ npm run test:network "Mint Faucet Token"
```

Update the ```tokenNameHex``` and ```mintingPolicy``` for the correct access token and faucet token in the .env file
```
# Token Configuration
ACCESS_TOKEN_NAME_HEX=
ACCESS_TOKEN_POLICY=
FAUCET_TOKEN_NAME_HEX=
FAUCET_TOKEN_POLICY=
```

Next, lock the faucet tokens to the validator script address
```
$ npm run test:network "Lock Faucet Token"
```

Using a preprod cardano explorer such as https://preprod.cardanoscan.io/, you should be able to verify that the faucet tokens are locked at the script address using the tx id provided in the testing output.

Now, you are ready to execute the smart contract.
```
$ npm run test:network "Withdraw Faucet Token 1"
```

Once the transaction is confirmed, you will see the 100 faucet tokens transferred from the fauacet validator script into the wallet.


For more information on Helios, please refer to the user documentation https://www.hyperion-bt.org/helios-book/ 



