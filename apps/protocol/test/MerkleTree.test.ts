import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ZERO_LEAF } from '@privi-cash/common';
import { deployContract, getNewTree } from './helpers/utils';
import { TREE_HEIGHT } from './helpers/constants';
import { deployHasher } from './helpers/hasher';
import { poseidonHash, toFixedHex } from 'privi-utils';

describe('MerkleTree', function () {
  async function fixture() {
    const hasher = await deployHasher();
    const merkleTree = await deployContract('MerkleTreeMock', TREE_HEIGHT, hasher.address);
    await merkleTree.initialize();
    return { hasher, merkleTree };
  }

  describe('Initialization', () => {
    it('should initialize', async () => {
      const { merkleTree } = await loadFixture(fixture);
      const zeroLeaf = await merkleTree.ZERO_LEAF();

      const firstSubtree = await merkleTree.filledSubtrees(0);
      const firstZero = await merkleTree.zeroes(0);

      expect(zeroLeaf).to.be.equal(ZERO_LEAF);
      expect(firstSubtree).to.be.equal(zeroLeaf);
      expect(firstZero).to.be.equal(zeroLeaf);
    });

    it('should correctly hash 2 leaves', async () => {
      const { merkleTree } = await loadFixture(fixture);
      const hash0 = await merkleTree.hashLeftRight(toFixedHex(123), toFixedHex(456));

      const hash2 = poseidonHash(123, 456);
      expect(hash0).to.equal(hash2);
    });

    it('should have correct initial merkle root', async () => {
      const { merkleTree } = await loadFixture(fixture);
      const tree = getNewTree();
      const contractRoot = await merkleTree.getLastRoot();
      expect(tree.root).to.equal(contractRoot);
    });
  });

  describe('Insertion', () => {
    it('should insert', async () => {
      const { merkleTree } = await loadFixture(fixture);
      const tree = getNewTree();
      await merkleTree.insert(toFixedHex(123), toFixedHex(456));
      tree.bulkInsert([123, 456]);
      expect(tree.root).to.be.be.equal(await merkleTree.getLastRoot());

      await merkleTree.insert(toFixedHex(678), toFixedHex(876));
      tree.bulkInsert([678, 876]);
      expect(tree.root).to.be.be.equal(await merkleTree.getLastRoot());
    });
  });

  describe('Merkle Root', () => {
    async function fixtureFilled() {
      const { merkleTree, hasher } = await loadFixture(fixture);
      await merkleTree.insert(toFixedHex(123), toFixedHex(456));
      return { merkleTree, hasher };
    }

    it('should return last root', async () => {
      const { merkleTree } = await fixtureFilled();
      const tree = getNewTree();
      tree.bulkInsert([123, 456]);
      const root = toFixedHex(tree.root);
      expect(await merkleTree.isKnownRoot(root)).to.equal(true);
    });

    it('should return older root', async () => {
      const { merkleTree } = await fixtureFilled();
      const tree = getNewTree();
      tree.bulkInsert([123, 456]);
      const root = toFixedHex(tree.root);
      await merkleTree.insert(toFixedHex(234), toFixedHex(432));
      expect(await merkleTree.isKnownRoot(root)).to.equal(true);
    });

    it('should fail on unknown root', async () => {
      const { merkleTree } = await fixtureFilled();
      const tree = getNewTree();
      tree.bulkInsert([456, 654]);
      const root = toFixedHex(tree.root);
      expect(await merkleTree.isKnownRoot(root)).to.equal(false);
    });

    it('should not return uninitialized roots', async () => {
      const { merkleTree } = await fixtureFilled();
      expect(await merkleTree.isKnownRoot(toFixedHex(0))).to.equal(false);
    });
  });
});
