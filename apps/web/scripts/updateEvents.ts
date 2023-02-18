import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import { uniqBy } from 'lodash';
import { poolAbi as ABI } from '../contracts';
import { instanceConfig, chains } from '../config/network';
import { loadCachedEvents, getPastEvents } from './helpers';
import { CachedCommitment, CachedNullifier } from '../types';
import { BigNumber } from 'ethers';

const EVENTS_PATH = './public/events';
const EVENTS = ['commitment', 'nullifier'];
const enabledChains = [chains.GOERLI, chains.POLYGON_MUMBAI];

async function main(eventType: string, chainId: number, token: string) {
  const { instanceAddress, deployedBlock } = instanceConfig[chainId].instances[token];
  const directory = `${EVENTS_PATH}/${chainId}`;

  const cachedEvents = await loadCachedEvents({
    name: `${eventType.toLowerCase()}s_${token}.json`,
    directory,
    deployedBlock,
  });

  console.log('Cached events count:', cachedEvents.events.length);
  console.log('Last block:', cachedEvents.lastBlock);

  let events: any[] = [];

  events = await getPastEvents({
    eventType,
    chainId,
    events,
    contractAttrs: [instanceAddress, ABI],
    fromBlock: cachedEvents.lastBlock + 1,
  });

  if (eventType === 'commitment') {
    events = events.map(({ blockNumber, transactionHash, args }) => {
      return {
        leafIndex: BigNumber.from(args?.index).toNumber(),
        commitment: args?.commitment,
        encryptedOutput: args?.encryptedOutput,
        blockNumber,
        transactionHash,
      };
    }) as CachedCommitment[];
  }

  if (eventType === 'nullifier') {
    events = events.map(({ blockNumber, transactionHash, args }) => {
      return {
        blockNumber,
        nullifier: args?.nullifier,
        transactionHash,
      };
    }) as CachedNullifier[];
  }

  let freshEvents = cachedEvents.events.concat(events);

  if (eventType === 'nullifier') {
    freshEvents = uniqBy(freshEvents, 'nullifier').sort((a, b) => b.blockNumber - a.blockNumber);
  } else if (eventType === 'commitment') {
    freshEvents = freshEvents.filter((e, index) => Number(e.leafIndex) === index);
  } else {
    throw new Error(`Unknown event ${eventType}`);
  }

  const eventsJson = JSON.stringify(freshEvents, null, 2) + '\n';

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }

  const writePath = `${directory}/${eventType.toLowerCase()}s_${token}.json`;
  console.log('Writing events to:', writePath);
  fs.writeFileSync(writePath, eventsJson);
}

async function start() {
  const [, , chain, token] = process.argv;

  console.log(`Input: chainId: ${chain} token: ${token}`);

  const chainId = Number(chain);
  if (!enabledChains.includes(chainId)) {
    throw new Error(`Supported chain ids ${enabledChains.join(', ')}`);
  }

  const instance = instanceConfig[chainId]?.instances[token];
  if (!instance) {
    throw new Error(`Instance not found for chain ${chainId} and token ${token}`);
  }

  for await (const event of EVENTS) {
    await main(event, chainId, token);
  }
}

start();
