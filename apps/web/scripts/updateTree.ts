import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
//@ts-ignore
import BloomFilter from 'bloomfilter.js';
import { MerkleTree } from 'fixed-merkle-tree';
//@ts-ignore
import { poseidon } from 'xcircomlib';
import { instanceConfig, chains } from '../config/network';
import { loadCachedEvents, saveZip } from './helpers';
import { BigNumber } from 'ethers';

const TREES_PATH = './public/trees';
const EVENTS_PATH = './public/events';

const EVENTS = ['commitment'];
const enabledChains = [chains.GOERLI, chains.POLYGON_MUMBAI];

const poseidonHash = (...inputs: any[]) => BigNumber.from(poseidon([...inputs])).toHexString();

const PARTS_COUNT = 4;

function createTreeZip(chainId: number, token: string) {
  try {
    for (const type of EVENTS) {
      const directory = `${TREES_PATH}/${chainId}`;
      const filename = `${type.toLowerCase()}s_${token}`;
      const baseFilename = `${directory}/${filename}`;

      const treesFolder = fs.readdirSync(directory);

      treesFolder.forEach((fileName) => {
        fileName = `${directory}/${fileName}`;
        const isInstanceFile = !fileName.includes('.zip') && fileName.includes(baseFilename);

        if (isInstanceFile) {
          saveZip(fileName);
        }
      });
    }
  } catch {}
}

async function createTree(chainId: number, token: string) {
  const { deployedBlock, treeHeight, zeroElement } = instanceConfig[chainId].instances[token];

  for (const eventType of EVENTS) {
    const treeDirectory = `${TREES_PATH}/${chainId}`;
    const filename = `${eventType.toLowerCase()}s_${token}`;
    const filePath = `${treeDirectory}/${filename}`;
    if (!fs.existsSync(treeDirectory)) {
      fs.mkdirSync(treeDirectory);
    }

    console.log('createTree', eventType);

    const { events } = await loadCachedEvents({
      name: `${eventType.toLowerCase()}s_${token}.json`,
      directory: `${EVENTS_PATH}/${chainId}`,
      deployedBlock,
    });

    console.log('Events count:', events.length);

    // to reduce the number of false positives
    const bloom = new BloomFilter(events.length);

    const eventsData = { leaves: [] as string[], metadata: {} as Record<string, any> };

    events.forEach((e, i) => {
      if (e.leafIndex !== i) {
        throw new Error(`leafIndex (${e.leafIndex}) !== i (${i})`);
      }
      const { leafIndex, commitment, ...rest } = e;
      eventsData.leaves.push(commitment);
      eventsData.metadata[commitment] = { ...rest, leafIndex };
    });

    console.log('Leaves count:', eventsData.leaves.length);

    const tree = new MerkleTree(treeHeight, eventsData.leaves, {
      zeroElement,
      hashFunction: poseidonHash,
    });

    const slices = tree.getTreeSlices(PARTS_COUNT) as any; // [edge(PARTS_COUNT)]

    slices.forEach((slice: any, index: number) => {
      slice.metadata = slice.elements.reduce((acc: any, curr: any) => {
        if (index < PARTS_COUNT - 1) {
          bloom.add(curr);
        }
        acc.push(eventsData.metadata[curr]);
        return acc;
      }, []);

      const sliceJson = JSON.stringify(slice, null, 2) + '\n';
      fs.writeFileSync(`${filePath}_slice${index + 1}.json`, sliceJson);
    });

    const bloomCache = bloom.serialize();
    fs.writeFileSync(`${filePath}_bloom.json`, bloomCache);
  }
}

async function main() {
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

  await createTree(chainId, token);
  createTreeZip(chainId, token);
}

main();
