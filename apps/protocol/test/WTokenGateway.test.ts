import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract } from './helpers/utils';
import { TREE_HEIGHT } from './helpers/constants';
import { deployHasher } from './helpers/hasher';
import { KeyPair, Utxo } from '@privi-cash/common';
import { prepareDepositProof, prepareWithdrawProof } from './helpers/proofs';
import { parseEther, randomHex } from 'privi-utils';

describe('WTokenGateway', function () {
  async function fixture() {
    const hasher = await deployHasher();
    const wToken = await deployContract('WTokenMock');
    const verifier2 = await deployContract('contracts/verifiers/Verifier2.sol:Verifier');
    const verifier16 = await deployContract('contracts/verifiers/Verifier16.sol:Verifier');
    const sanctionsList = await deployContract('SanctionsListMock');
    const maxDepositAmt = parseEther('10');

    const poolImpl = await deployContract(
      'Pool',
      TREE_HEIGHT,
      hasher.address,
      wToken.address,
      verifier2.address,
      verifier16.address,
      sanctionsList.address
    );
    const { data: initializeData } = await poolImpl.populateTransaction.initialize(maxDepositAmt);
    const poolProxy = await deployContract('PoolProxyMock', poolImpl.address, initializeData);

    const pool = poolImpl.attach(poolProxy.address);
    const wTokenGateway = await deployContract('WTokenGateway', wToken.address);

    return { hasher, pool, wToken, wTokenGateway };
  }

  it('deposit works', async function () {
    const { pool, wTokenGateway, wToken } = await loadFixture(fixture);

    const keyPair = KeyPair.createRandom();
    const amount = parseEther('1');

    const depositUtxo = new Utxo({ amount, keyPair });

    const { proofArgs, extData } = await prepareDepositProof({
      pool,
      outputs: [depositUtxo],
    });

    await wTokenGateway.deposit(pool.address, proofArgs, extData, {
      value: amount,
    });

    const poolBalance = await wToken.balanceOf(pool.address);
    expect(poolBalance).to.be.equal(amount);
  });

  it('withdraw works', async function () {
    const { pool, wTokenGateway, wToken } = await loadFixture(fixture);

    const keyPair = KeyPair.createRandom();
    const depositAmount = parseEther('1');
    const depositUtxo = new Utxo({ amount: depositAmount, keyPair });

    const { proofArgs, extData } = await prepareDepositProof({
      pool,
      inputs: [Utxo.zero(), Utxo.zero()],
      outputs: [depositUtxo],
    });

    await wTokenGateway.deposit(pool.address, proofArgs, extData, {
      value: depositAmount,
    });

    const poolBalance = await wToken.balanceOf(pool.address);
    expect(poolBalance).to.equal(depositAmount);

    const recipient = randomHex(20);
    const withdrawAmount = depositAmount;
    const withdrawUtxo = new Utxo({
      amount: depositAmount.sub(withdrawAmount),
      keyPair,
    });
    const { proofArgs: withdrawProofArgs, extData: withdrawExtData } = await prepareWithdrawProof({
      pool,
      inputs: [depositUtxo],
      outputs: [withdrawUtxo],
      recipient: wTokenGateway.address,
    });

    await wTokenGateway.withdraw(pool.address, recipient, withdrawProofArgs, withdrawExtData);

    const recipientBalance = await ethers.provider.getBalance(recipient);

    expect(recipientBalance).to.equal(depositAmount);
  });
});
