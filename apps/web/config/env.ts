export const env = process.env.NODE_ENV as string;
export const isDev = env === 'development';

export const rpcGoerli = process.env.NEXT_PUBLIC_RPC_GOERLI as string;
export const rpcPolygonMumbai = process.env.NEXT_PUBLIC_RPC_POLYGON_MUMBAI as string;
export const rpcPolygonMainnet = process.env.NEXT_PUBLIC_RPC_POLYGON_MAINNET as string;
export const rpcGnosisChiado = process.env.NEXT_PUBLIC_RPC_GNOSIS_CHIADO as string;

export const keyAlchemyGoerli = rpcGoerli.split('/').pop() as string;
export const keyAlchemyPolygonMainnet = rpcPolygonMainnet.split('/').pop() as string;
export const keyAlchemyPolygonMumbai = rpcPolygonMumbai.split('/').pop() as string;

export const testPrivateKey =
  env === 'development' ? (process.env.NEXT_PUBLIC_TEST_PRIVATE_KEY as string) : '';

export const testShieldedPk1 = process.env.NEXT_PUBLIC_TEST_SHIELDED_PRIVATE_KEY_1 as string;
export const testShieldedPk2 = process.env.NEXT_PUBLIC_TEST_SHIELDED_PRIVATE_KEY_2 as string;
