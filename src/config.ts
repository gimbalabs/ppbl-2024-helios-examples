import * as dotenv from 'dotenv';
import * as bip39 from 'bip39';

// Load .env file contents into process.env
dotenv.config();

interface EnvConfig {
  USE_EMULATOR: string;
  WALLET_ENTROPY: string;
  BLOCKFROST_API_KEY: string;
  ACCESS_TOKEN_NAME_HEX: string;
  ACCESS_TOKEN_POLICY: string;
  FAUCET_TOKEN_NAME_HEX: string;
  FAUCET_TOKEN_POLICY: string;
}

export function generateNewMnemonic(wordCount: 128 | 256 = 256): string {
  return bip39.generateMnemonic(wordCount);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

// Validate that all required environment variables are present
function validateEnv(): EnvConfig {
  const requiredEnvVars: (keyof EnvConfig)[] = [
    'USE_EMULATOR',
    'BLOCKFROST_API_KEY',
    'ACCESS_TOKEN_NAME_HEX',
    'ACCESS_TOKEN_POLICY',
    'FAUCET_TOKEN_NAME_HEX',
    'FAUCET_TOKEN_POLICY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate the mnemonic only when using
  if (process.env.USE_EMULATOR! === 'false' && !validateMnemonic(process.env.WALLET_ENTROPY!)) {
    // Generate a new 24-word mnemonic
    const newMnemonic = generateNewMnemonic(256);
    console.error('Invalid mnemonic in WALLET_ENTROPY')
    console.log('Here is a valid 24 word mnemonic to try again: ', newMnemonic);
    throw new Error('Invalid mnemonic in WALLET_ENTROPY');
  }

  return {
    USE_EMULATOR: process.env.USE_EMULATOR!,
    WALLET_ENTROPY: process.env.WALLET_ENTROPY!,
    BLOCKFROST_API_KEY: process.env.BLOCKFROST_API_KEY!,
    ACCESS_TOKEN_NAME_HEX: process.env.ACCESS_TOKEN_NAME_HEX!,
    ACCESS_TOKEN_POLICY: process.env.ACCESS_TOKEN_POLICY!,
    FAUCET_TOKEN_NAME_HEX: process.env.FAUCET_TOKEN_NAME_HEX!,
    FAUCET_TOKEN_POLICY: process.env.FAUCET_TOKEN_POLICY!
  };
}

export const configEnv = validateEnv(); 