import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import { uniqBy } from 'lodash';
import { instanceConfig, chains } from '../config/network';
import { loadCachedEvents, saveZip } from './helpers';

const EVENTS_PATH = './public/events';
const EVENTS = ['commitment', 'nullifier'];
const enabledChains = [chains.GOERLI, chains.POLYGON_MUMBAI];

async function updateCommon(chainId: number, token: string) {
  const directory = `${EVENTS_PATH}/${chainId}`;
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }

  for (const eventType of EVENTS) {
    const filename = `${eventType.toLowerCase()}s_${token}.json`;
    const isSaved = saveZip(`${directory}/${filename}`);

    if (isSaved) {
      try {
        await testCommon(chainId, eventType, token, filename);
      } catch (err: any) {
        console.error(err.message);
      }
    }
  }
}

async function testCommon(chainId: number, eventType: string, token: string, filename: string) {
  const { deployedBlock } = instanceConfig[chainId].instances[token];
  const directory = `${EVENTS_PATH}/${chainId}`;

  const cachedEvents = await loadCachedEvents({
    name: filename,
    directory,
    deployedBlock,
  });

  console.log('Cached events', cachedEvents.events.length, eventType);

  let events = cachedEvents.events;
  if (eventType === 'nullifier') {
    events = uniqBy(cachedEvents.events, 'nullifier');
  } else if (eventType === 'commitment') {
    events = cachedEvents.events.filter((e, index) => Number(e.leafIndex) === index);
  }
  if (events.length !== cachedEvents.events.length) {
    console.error('events.length', events.length);
    console.error('cachedEvents.events.length', cachedEvents.events.length);
    throw new Error(
      `Duplicates was detected in ${filename} (${events.length - cachedEvents.events.length})`,
    );
  }
}

async function main() {
  const [, , chain, token] = process.argv;

  console.log(`Input: chainId: ${chain} token: ${token}\n`);

  const chainId = Number(chain);
  if (!enabledChains.includes(chainId)) {
    throw new Error(`Supported chain ids ${enabledChains.join(', ')}`);
  }

  const instance = instanceConfig[chainId]?.instances[token];
  if (!instance) {
    throw new Error(`Instance not found for chain ${chainId} and token ${token}`);
  }

  await updateCommon(chainId, token);
}

main();
