import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { parseEther, randomHex } from 'privi-utils';
import { KeyPair, Utxo } from '@privi-cash/common';
import { deployContract } from './helpers/utils';
import { TREE_HEIGHT } from './helpers/constants';
import { deployHasher } from './helpers/hasher';
import { transactDeposit, transactWithdraw, transactTransfer } from './helpers/proofs';

describe('Pool', function () {
  async function fixture() {
    const hasher = await deployHasher();
    const token = await deployContract('WTokenMock');
    const verifier2 = await deployContract('contracts/verifiers/Verifier2.sol:Verifier');
    const verifier16 = await deployContract('contracts/verifiers/Verifier16.sol:Verifier');
    const sanctionsList = await deployContract('SanctionsListMock');
    const maxDepositAmt = parseEther('100');

    const poolImpl = await deployContract(
      'Pool',
      TREE_HEIGHT,
      hasher.address,
      token.address,
      verifier2.address,
      verifier16.address,
      sanctionsList.address
    );
    const { data: initializeData } = await poolImpl.populateTransaction.initialize(maxDepositAmt);
    const poolProxy = await deployContract('PoolProxyMock', poolImpl.address, initializeData);

    const pool = poolImpl.attach(poolProxy.address);

    const amount = parseEther('8000').toString();
    await token.deposit({ value: amount });
    await token.approve(pool.address, amount);

    return { hasher, pool, token };
  }

  describe('Deployment', function () {
    it('constants check', async () => {
      const { pool } = await loadFixture(fixture);
      const maxFee = await pool.MAX_FEE();
      const maxExtAmount = await pool.MAX_EXT_AMOUNT();
      const fieldSize = await pool.FIELD_SIZE();
      expect(maxExtAmount.add(maxFee)).to.be.lt(fieldSize);
    });
  });

  describe('Deposit', function () {
    it('should be able to deposit', async function () {
      const { pool, token } = await loadFixture(fixture);
      const keyPair = KeyPair.createRandom();
      const depositAmount = parseEther('0.1');
      const depositUtxo = new Utxo({ amount: depositAmount, keyPair });
      await transactDeposit({ pool, outputs: [depositUtxo] });
    });
  });

  describe('Withdraw', function () {
    it('should be able to withdraw', async function () {
      const { pool, token } = await loadFixture(fixture);
      const keyPair = KeyPair.createRandom();
      const depositAmount = parseEther('0.1');
      const depositUtxo = new Utxo({ amount: depositAmount, keyPair });
      await transactDeposit({ pool, outputs: [depositUtxo] });

      const withdrawAmount = parseEther('0.05');
      const withdrawUtxo = new Utxo({
        amount: depositAmount.sub(withdrawAmount),
        keyPair,
      });
      const recipient = randomHex(20);
      await transactWithdraw({ pool, inputs: [depositUtxo], outputs: [withdrawUtxo], recipient });

      const balance = await token.balanceOf(recipient);
      expect(balance).to.be.eq(withdrawAmount);
    });

    it('should be able to withdraw with relayers', async function () {
      const { pool, token } = await loadFixture(fixture);
      const keyPair = KeyPair.createRandom();
      const depositAmount = parseEther('0.1');
      const depositUtxo = new Utxo({ amount: depositAmount, keyPair });
      await transactDeposit({ pool, outputs: [depositUtxo] });

      const recipient = randomHex(20);
      const relayer = randomHex(20);
      const withdrawAmount = parseEther('0.05');
      const fee = parseEther('0.01');

      const outputUtxo = new Utxo({
        amount: depositAmount.sub(withdrawAmount).sub(fee),
        keyPair,
      });

      await transactWithdraw({
        pool,
        inputs: [depositUtxo],
        outputs: [outputUtxo],
        recipient,
        relayer,
        fee,
      });

      const recipientBalance = await token.balanceOf(recipient);
      const relayerBalance = await token.balanceOf(relayer);

      expect(recipientBalance).to.be.eq(withdrawAmount);
      expect(relayerBalance).to.be.eq(fee);
    });
  });

  describe('Transfer', function () {
    it('should be able to transfer', async function () {
      const { pool, token } = await loadFixture(fixture);
      const fromKeyPair = KeyPair.createRandom();
      const toKeyPair = KeyPair.createRandom();

      const depositAmount = parseEther('10');
      const depositUtxo = new Utxo({ amount: depositAmount, keyPair: fromKeyPair });
      await transactDeposit({ pool, outputs: [depositUtxo] });

      const transferAmount = parseEther('3');
      const transferUtxo = new Utxo({
        amount: transferAmount,
        keyPair: toKeyPair,
      });
      const changeUtxo = new Utxo({
        amount: depositAmount.sub(transferAmount),
        keyPair: fromKeyPair,
      });
      await transactTransfer({ pool, inputs: [depositUtxo], outputs: [transferUtxo, changeUtxo] });
    });

    it('should be able to transfer with relayers', async function () {
      const { pool, token } = await loadFixture(fixture);
      const fromKeyPair = KeyPair.createRandom();
      const toKeyPair = KeyPair.createRandom();

      const depositAmount = parseEther('10');
      const relayer = randomHex(20);
      const fee = parseEther('0.01');

      const depositUtxo = new Utxo({ amount: depositAmount, keyPair: fromKeyPair });
      await transactDeposit({ pool, outputs: [depositUtxo] });

      const transferAmount = parseEther('3');
      const toOutputUtxo = new Utxo({
        amount: transferAmount,
        keyPair: toKeyPair,
      });
      const fromOutputUtxo = new Utxo({
        amount: depositAmount.sub(transferAmount).sub(fee),
        keyPair: fromKeyPair,
      });
      await transactTransfer({
        pool,
        inputs: [depositUtxo],
        outputs: [toOutputUtxo, fromOutputUtxo],
        relayer,
        fee,
      });

      const relayerBalance = await token.balanceOf(relayer);

      expect(relayerBalance).to.be.eq(fee);
    });
  });
});
