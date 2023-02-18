import { Element, MerkleTree, PartialMerkleTree, TreeEdge } from 'fixed-merkle-tree';
import { downloadFile, poseidonHash } from 'utils/snark';
import { Instance } from 'config/network';
import { TREE_PARTS_COUNT } from 'config/constants';
import { bloomService } from './bloomFilter';
import { MerkleTreeServiceArgs } from './types';

class MerkleTreeService {
  chainId: number;
  token: string;
  commitment: string;
  bloomService: any;
  instance: Instance;

  constructor({ chainId, token, commitment, instance }: MerkleTreeServiceArgs) {
    this.chainId = chainId;
    this.token = token;
    this.commitment = commitment;
    this.instance = instance;

    // this.idb = window.$nuxt.$indexedDB(netId);
    this.bloomService = bloomService({
      netId: chainId,
      commitment,
      fileFolder: 'trees',
      fileName: `commitments_${token}_bloom.json.zip`,
    });
  }

  getFileName(partNumber = TREE_PARTS_COUNT) {
    return `trees/${this.chainId}/commitments_${this.token}_slice${partNumber}.json.zip`;
  }

  createTree(leaves: Element[]) {
    const { treeHeight, zeroElement } = this.instance;

    return new MerkleTree(treeHeight, leaves, {
      zeroElement,
      hashFunction: poseidonHash,
    });
  }

  async downloadEdge(name: string) {
    const slicedEdge = await downloadFile({
      name,
      contentType: 'string',
    });

    if (!slicedEdge) {
      throw new Error('Cant download file');
    }

    return JSON.parse(slicedEdge);
  }

  createPartialTree({ edge, elements }: { edge: TreeEdge; elements: Element[] }) {
    const { treeHeight, zeroElement } = this.instance;

    return new PartialMerkleTree(treeHeight, edge, elements, {
      zeroElement,
      hashFunction: poseidonHash,
    });
  }

  async getTreeFromCache() {
    try {
      const initialEdge = await this.downloadEdge(this.getFileName());
      const partialTree = this.createPartialTree(initialEdge);

      if (!this.commitment || initialEdge.elements.includes(this.commitment)) {
        return partialTree;
      }

      const isCacheHasCommitment = await this.bloomService.checkBloom();

      if (!isCacheHasCommitment) {
        return partialTree;
      }

      let edge;
      let elements: Element[] = [];

      for (let i = TREE_PARTS_COUNT - 1; i > 0; i--) {
        const slicedEdge = await this.downloadEdge(this.getFileName(i));

        edge = slicedEdge.edge;
        elements = [].concat(slicedEdge.elements, elements as any);

        if (slicedEdge.elements.includes(this.commitment)) {
          break;
        }
      }

      partialTree.shiftEdge(edge, elements);

      return partialTree;
    } catch (err) {
      return undefined;
    }
  }

  // async getTreeFromDB() {
  //   try {
  //     const stringifyCachedTree = await this.idb.getAll({
  //       storeName: `stringify_tree_${this.instanceName}`,
  //     });

  //     if (!stringifyCachedTree || !stringifyCachedTree.length) {
  //       return undefined;
  //     }

  //     const [{ tree }] = stringifyCachedTree;
  //     const parsedTree = JSON.parse(tree);
  //     const isPartial = '_edgeLeaf' in parsedTree;

  //     const savedTree = isPartial
  //       ? PartialMerkleTree.deserialize(parsedTree, mimc.hash)
  //       : MerkleTree.deserialize(parsedTree, mimc.hash);

  //     if (isPartial) {
  //       const edgeIndex = savedTree.edgeIndex;
  //       const indexOfEvent = savedTree.indexOf(this.commitment);

  //       // ToDo save edges mapping { edgeIndex, edgeSlice }
  //       if (indexOfEvent === -1 && edgeIndex !== 0) {
  //         const isCacheHasCommitment = await this.bloomService.checkBloom();

  //         if (isCacheHasCommitment) {
  //           let edge;
  //           let elements = [];

  //           for (let i = trees.PARTS_COUNT; i > 0; i--) {
  //             const slicedEdge = await this.downloadEdge(this.getFileName(i));

  //             if (edgeIndex > slicedEdge.edge.edgeIndex) {
  //               edge = slicedEdge.edge;
  //               elements = [].concat(slicedEdge.elements, elements);
  //             }

  //             if (slicedEdge.elements.includes(this.commitment)) {
  //               break;
  //             }
  //           }

  //           savedTree.shiftEdge(edge, elements);
  //         }
  //       }
  //     }

  //     return savedTree;
  //   } catch (err) {
  //     return undefined;
  //   }
  // }

  async getTree() {
    // const { nativeCurrency } = networkConfig[`netId${this.netId}`]
    // const hasCache = nativeCurrency === this.currency && Number(this.netId) === 1

    // let cachedTree = await this.getTreeFromDB()

    // if (!cachedTree && hasCache) {
    //   cachedTree = await this.getTreeFromCache()
    // }
    const cachedTree = await this.getTreeFromCache();
    return cachedTree;
  }

  // async saveTree({ tree }) {
  //   try {
  //     await this.idb.putItem({
  //       storeName: `stringify_tree_${this.instanceName}`,
  //       data: {
  //         hashTree: '1', // need for replace tree
  //         tree: tree.toString(),
  //       },
  //       key: 'hashTree',
  //     });
  //   } catch (err) {
  //     console.error('saveCachedTree has error:', err.message);
  //   }
  // }
}

class TreesFactory {
  instances = new Map();

  getService = (payload: MerkleTreeServiceArgs) => {
    const instanceName = `${payload.token}`;
    if (this.instances.has(instanceName)) {
      return this.instances.get(instanceName);
    }

    const instance = new MerkleTreeService(payload);
    this.instances.set(instanceName, instance);
    return instance;
  };
}

export const treesInterface = new TreesFactory();
