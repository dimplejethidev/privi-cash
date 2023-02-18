import fs from 'fs';
import Jszip from 'jszip';
import { ethers, EventFilter } from 'ethers';
import { instanceConfig } from '../../config/network';
import { CachedCommitment } from '../../types';

const jszip = new Jszip();

export async function download({ name, directory, contentType }: any) {
  const path = `${directory}/${name}.zip`.toLowerCase();

  const data = fs.readFileSync(path);
  const zip = await jszip.loadAsync(data);
  const file = zip.file(path.replace(directory, '').slice(0, -4).toLowerCase());
  const content = await file?.async(contentType);

  return content;
}

export async function loadCachedEvents({ name, directory, deployedBlock }: any) {
  let events: CachedCommitment[] = [];
  let lastBlock: number = deployedBlock;
  try {
    const content = await download({ contentType: 'string', directory, name });

    if (content) {
      events = JSON.parse(content);

      const [lastEvent] = JSON.parse(content).sort(
        //@ts-ignore
        (a, b) => b.blockNumber - a.blockNumber,
      );
      lastBlock = lastEvent.blockNumber;
    }
    return {
      events,
      lastBlock,
    };
  } catch (err: any) {
    console.error(`Method loadCachedEvents has error: ${err.message}`);
    return {
      events,
      lastBlock: deployedBlock,
    };
  }
}

export async function getPastEvents({ eventType, fromBlock, chainId, events, contractAttrs }: any) {
  let downloadedEvents = events;

  const rpcUrl = instanceConfig[chainId].rpcUrl;
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  //@ts-ignore
  const contract = new ethers.Contract(...contractAttrs, provider);

  const currentBlockNumber = await provider.getBlockNumber();
  const blockDifference = Math.ceil(currentBlockNumber - fromBlock);
  const blockRange = Number(chainId) === 56 ? 4950 : blockDifference / 20;
  let chunksCount = blockDifference === 0 ? 1 : Math.ceil(blockDifference / blockRange);
  const chunkSize = Math.ceil(blockDifference / chunksCount);

  let toBlock = fromBlock + chunkSize;

  if (fromBlock < currentBlockNumber) {
    if (toBlock >= currentBlockNumber) {
      toBlock = currentBlockNumber;
      chunksCount = 1;
    }

    console.log(`Fetching ${eventType}, chainId: ${chainId}`, `chunksCount: ${chunksCount}`);
    let eventFilter: EventFilter;
    if (eventType === 'commitment') {
      eventFilter = contract.filters.NewCommitment();
    } else if (eventType === 'nullifier') {
      eventFilter = contract.filters.NewNullifier();
    } else {
      throw new Error(`Event type ${eventType} unknown`);
    }

    for (let i = 0; i < chunksCount; i++)
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));

        console.log(`Block: ${fromBlock} to ${toBlock}`);

        const eventsChunk = await contract.queryFilter(eventFilter, fromBlock, toBlock);

        if (eventsChunk) {
          downloadedEvents = downloadedEvents.concat(eventsChunk);
          console.log('Downloaded events count:', eventsChunk.length);
          console.log('------------------------------------------');
        }
        fromBlock = toBlock;
        toBlock += chunkSize;
      } catch (err: any) {
        console.log('getPastEvents events', `chunk number - ${i}, has error: ${err.message}`);
        chunksCount = chunksCount + 1;
      }
  }
  return downloadedEvents;
}
