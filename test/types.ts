export type ReturnType = {
  status: number;
  txName: string;
  msg: undefined | string;
  txId: undefined | string;
  tokenNameHex: undefined | string;
  mintingPolicy: undefined | string;
  cpu: undefined | bigint;
  mem: undefined | bigint;
  fee: undefined | bigint;
};
