# Plutus Project Based Learning 
## Testing PPBL Faucet in Helios
### Setup
```
$ git clone https://github.com/gimbalabs/ppbl-2024-helios-examples.git
$ cd ppbl-2024-helios-examples
$ npm install
$ cp .env.example .env
```

### Runing the emulator test suite
```
$ npm test
...
stdout | test/faucet.test.ts > Faucet
Transaction Name     | CPU             | MEM         | FEE       
-----------------------------------------------------------------
Mint                 | 69,100,794      | 226,679     | 241,819 
Mint                 | 73,415,461      | 235,821     | 252,910 
Lock                 |                 |             | 174,785 
Withdraw             | 123,794,616     | 382,924     | 290,726 
Withdraw             | 125,740,406     | 401,139     | 295,657 
E2E Faucet Test - END

 ✓ test/faucet.test.ts (6 tests) 627ms
   ✓ Faucet > Mint Access Token 190ms
   ✓ Faucet > Mint Faucet Token 82ms
   ✓ Faucet > Lock Faucet Token 65ms
   ✓ Faucet > Withdraw Faucet Token 1 119ms
   ✓ Faucet > Withdraw Faucet Token 2 113ms
   ✓ Faucet > Check Wallet Balance 6ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  07:27:49
   Duration  1.13s (transform 107ms, setup 0ms, collect 168ms, tests 627ms, environment 0ms, prepare 119ms)
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



