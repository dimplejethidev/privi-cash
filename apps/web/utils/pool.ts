import { KeyPair, Utxo } from '@privi-cash/common';
// import { Relayer } from 'config/network';
import { BigNumber, BigNumberish, Contract, Event } from 'ethers';
import { BN, poseidonHash, toFixedHex } from 'privi-utils';

export const fetchUserShieldedAccount = async (address: string, registrar: Contract) => {
  const registerEventFilter = registrar.filters.ShieldedAddress(address);
  const events = await registrar.queryFilter(registerEventFilter);
  const shieldedAddress = events?.[events.length - 1]?.args?.shieldedAddress;

  if (shieldedAddress) {
    return KeyPair.fromAddress(shieldedAddress);
  }
};

export const fetchCommitmentEvents = (pool: Contract) => {
  const filter = pool.filters.CommitmentInserted();
  const eventData = pool.queryFilter(filter, 0);
  return eventData;
};

export const fetchUserUnspentNotes = async (keyPair: KeyPair, pool: Contract) => {
  const eventsList = await fetchCommitmentEvents(pool);

  const outputs: Utxo[] = [];
  for (let i = eventsList.length - 1; i >= 0; i--) {
    const encryptedOutput = eventsList[i]?.args?.encryptedOutput as string;
    const leafIndex = BN(eventsList[i]?.args?.leafIndex || 0).toNumber();
    try {
      const utxo = Utxo.decrypt(keyPair, encryptedOutput, leafIndex);
      outputs.push(utxo);
    } catch (e) {}
  }

  const isSpentArray: boolean[] = await Promise.all(
    outputs.map((utxo) => pool.isSpent(toFixedHex(utxo.nullifier as string)))
  );

  const unspentOutputs = outputs.filter((_, i) => !isSpentArray[i]).reverse();

  return unspentOutputs;
};

export function generateKeyPairFromSignature(signature: string) {
  const privateKey = toFixedHex(poseidonHash(signature));
  return new KeyPair(privateKey);
}

// export async function fetchShieldedAddressOf(
//   address: string,
//   pool: Contract
// ): Promise<string | undefined> {
//   const registerEventFilter = pool.filters.PublicKey(address);
//   const events = await pool.queryFilter(registerEventFilter);
//   return events?.[events.length - 1]?.args?.key;
// }

export const getUTXOsOf = async (keyPair: KeyPair, events: any[], pool: Contract) => {
  const outputs: Utxo[] = [];
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    try {
      const utxo = Utxo.decrypt(keyPair, event.encryptedOutput, event.leafIndex);
      outputs.push(utxo);
    } catch (e) {}
  }

  const isSpentArray: boolean[] = await Promise.all(
    outputs.map((utxo) => pool.isSpent(toFixedHex(utxo.nullifier as string)))
  );

  const unspentOutputs = outputs.filter((_, i) => !isSpentArray[i]).reverse();

  return unspentOutputs;
};

export function generateKeyPair(signature: string) {
  const privateKey = toFixedHex(poseidonHash(signature));
  return new KeyPair(privateKey);
}

export function formatEvents(events: Event[], type: string) {
  if (type === 'commitment') {
    return events.map(({ blockNumber, transactionHash, args }) => {
      return {
        leafIndex: BigNumber.from(args?.index).toNumber(),
        commitment: args?.commitment,
        encryptedOutput: args?.encryptedOutput,
        blockNumber,
        transactionHash,
      };
    });
  } else if (type === 'nullifier') {
    return events.map(({ blockNumber, transactionHash, args }) => {
      return {
        blockNumber,
        nullifier: args?.nullifier,
        transactionHash,
      };
    });
  }

  throw new Error(`Unknown event ${type}`);
}

export function checkCommitments(events = []) {
  events.forEach(({ leafIndex }, i) => {
    if (leafIndex !== i) {
      console.error(`Missing deposit event for deposit #${i}`);
      throw new Error(`Missing deposit event for deposit #${i}`);
    }
  });
}

export async function checkRoot(root: BigNumberish, pool: Contract) {
  const isKnownRoot = await pool.isKnownRoot(root);

  if (!isKnownRoot) {
    throw new Error('Unknown root');
  }
}

export const estimateGas = async ({ proofArgs, extData }: any, pool: Contract) => {
  const estimate = await pool.estimateGas.transact(proofArgs, extData, {
    gasLimit: 2_000_000,
  });
  return estimate;
};

export const calculateRelayerFee = ({
  amount,
  gasPrice,
}: {
  amount?: BigNumber;
  gasPrice: BigNumber;
}) => {
  // const { feePercent, fixedFee } = relayer;
  const gasFee = gasPrice.mul(2_000_000);
  let serviceFee: BigNumber = BigNumber.from(0);
  // if (!amount || amount.isZero()) {
  //   // Assume a Transfer
  //   serviceFee = BigNumber.from(fixedFee);
  // } else {
  //   // Assumes a Withdraw
  //   serviceFee = amount.mul(feePercent * 10e6).div(10e6);
  // }

  const totalFee = serviceFee.add(gasFee);
  return {
    serviceFee,
    gasFee,
    totalFee,
  };
};

// export const calculateRelayerFee = ({
//   amount,
//   gasPrice,
//   relayer,
// }: {
//   relayer: Relayer;
//   amount?: BigNumber;
//   gasPrice: BigNumber;
// }) => {
//   const { feePercent, fixedFee } = relayer;
//   const gasFee = gasPrice.mul(2_000_000);
//   let serviceFee: BigNumber;
//   if (!amount || amount.isZero()) {
//     // Assume a Transfer
//     serviceFee = BigNumber.from(fixedFee);
//   } else {
//     // Assumes a Withdraw
//     serviceFee = amount.mul(feePercent * 10e6).div(10e6);
//   }

//   const totalFee = serviceFee.add(gasFee);
//   return {
//     serviceFee,
//     gasFee,
//     totalFee,
//   };
// };
