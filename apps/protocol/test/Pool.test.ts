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
        keyPair: KeyPair.createRandom(),
      });
      const changeUtxo = new Utxo({
        amount: depositAmount.sub(transferAmount),
        keyPair: fromKeyPair,
      });
      await transactTransfer({ pool, inputs: [depositUtxo], outputs: [transferUtxo, changeUtxo] });
    });
  });

  // describe('Transaction', function () {
  //   it('should deposit, transact and withdraw', async function () {
  //     const { pool, token } = await loadFixture(fixture);

  //     // Alice deposits into pool
  //     const aliceKeyPair = KeyPair.createRandom();
  //     const aliceDepositAmount = parseEther('0.1');
  //     const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keyPair: aliceKeyPair });
  //     await transaction({ pool, outputs: [aliceDepositUtxo] });

  //     // Bob gives Alice address to send some eth inside the shielded pool
  //     const bobKeyPair = new KeyPair(); // contains private and public keys
  //     const bobAddress = bobKeyPair.address(); // contains only public key

  //     // Alice sends some funds to Bob
  //     const bobSendAmount = utils.parseEther('0.06');
  //     const bobSendUtxo = new Utxo({
  //       amount: bobSendAmount,
  //       keyPair: KeyPair.fromAddress(bobAddress),
  //     });
  //     const aliceChangeUtxo = new Utxo({
  //       amount: aliceDepositAmount.sub(bobSendAmount),
  //       keyPair: aliceDepositUtxo.keyPair,
  //     });
  //     await transaction({
  //       pool,
  //       inputs: [aliceDepositUtxo],
  //       outputs: [bobSendUtxo, aliceChangeUtxo],
  //     });

  //     // Bob parses chain to detect incoming funds
  //     const filter = pool.filters.NewCommitment();
  //     const fromBlock = await ethers.provider.getBlock('latest');
  //     const events = await pool.queryFilter(filter, fromBlock.number);
  //     let bobReceiveUtxo;
  //     try {
  //       bobReceiveUtxo = Utxo.decrypt(
  //         bobKeyPair,
  //         events[0].args?.encryptedOutput,
  //         events[0].args?.index
  //       );
  //     } catch (e) {
  //       // we try to decrypt another output here because it shuffles outputs before sending to blockchain
  //       bobReceiveUtxo = Utxo.decrypt(
  //         bobKeyPair,
  //         events[1].args?.encryptedOutput,
  //         events[1].args?.index
  //       );
  //     }
  //     expect(bobReceiveUtxo.amount).to.be.equal(bobSendAmount);

  //     // Bob withdraws a part of his funds from the shielded pool
  //     const bobWithdrawAmount = utils.parseEther('0.05');
  //     const bobEthAddress = '0xDeaD00000000000000000000000000000000BEEf';
  //     const bobChangeUtxo = new Utxo({
  //       amount: bobSendAmount.sub(bobWithdrawAmount),
  //       keyPair: bobKeyPair,
  //     });
  //     await transaction({
  //       pool,
  //       inputs: [bobReceiveUtxo],
  //       outputs: [bobChangeUtxo],
  //       recipient: bobEthAddress,
  //     });

  //     const bobBalance = await ethers.provider.getBalance(bobEthAddress);
  //     expect(bobBalance).to.be.equal(bobWithdrawAmount);
  //   }).timeout(80000);

  //   it('should work with 16 inputs', async function () {
  //     const { pool } = await loadFixture(fixture);

  //     const keyPair = KeyPair.createRandom();
  //     const depositAmount = utils.parseEther('0.07');
  //     const depositUtxo = new Utxo({ amount: depositAmount, keyPair });
  //     await transaction({
  //       pool,
  //       inputs: [Utxo.zero(), Utxo.zero(), Utxo.zero()],
  //       outputs: [depositUtxo],
  //     });
  //   });

  //   it.only('withdraw should work with relayers', async function () {
  //     const { pool, token } = await loadFixture(fixture);

  //     const [sender, relayer] = await ethers.getSigners();

  //     const recipientAddress = randomHex(20);

  //     // Alice deposits into pool
  //     const aliceKeyPair = KeyPair.createRandom();
  //     const aliceDepositAmount = utils.parseEther('0.5');
  //     const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keyPair: aliceKeyPair });
  //     await transaction({ pool, outputs: [aliceDepositUtxo] });

  //     // Alice withdraws
  //     const relayerFee = utils.parseEther('0.01');
  //     const aliceWithdrawAmount = utils.parseEther('0.2');
  //     const total = aliceWithdrawAmount.add(relayerFee);

  //     const aliceChangeAmount = aliceDepositAmount.sub(total);
  //     const aliceChangeUtxo = new Utxo({ amount: aliceChangeAmount, keyPair: aliceKeyPair });

  //     await transaction({
  //       pool,
  //       inputs: [aliceDepositUtxo],
  //       outputs: [aliceChangeUtxo],
  //       fee: relayerFee,
  //       relayer: relayer.address,
  //       recipient: recipientAddress,
  //     });

  //     const relayerBal = await token.balanceOf(relayer.address);
  //     const recipientBal = await ethers.provider.getBalance(recipientAddress);

  //     expect(recipientBal).to.be.equal(aliceWithdrawAmount);
  //     expect(relayerBal).to.be.equal(relayerFee);
  //   });

  //   it.only('transfer should work with relayers', async function () {
  //     const { pool, token } = await loadFixture(fixture);

  //     const [sender, relayer] = await ethers.getSigners();

  //     const recipientAddress = randomHex(20);

  //     // Alice deposits into pool
  //     const aliceKeyPair = KeyPair.createRandom();
  //     const aliceDepositAmount = utils.parseEther('0.5');
  //     const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keyPair: aliceKeyPair });
  //     await transaction({ pool, outputs: [aliceDepositUtxo] });

  //     const bobKeyPair = KeyPair.createRandom();

  //     // Alice sends to bob
  //     const relayerFee = utils.parseEther('0.01');
  //     const bobReceiveAmount = utils.parseEther('0.2');
  //     const total = bobReceiveAmount.add(relayerFee);

  //     const aliceChangeAmount = aliceDepositAmount.sub(total);
  //     const aliceChangeUtxo = new Utxo({ amount: aliceChangeAmount, keyPair: aliceKeyPair });
  //     const bobReceiveUtxo = new Utxo({ amount: bobReceiveAmount, keyPair: bobKeyPair });

  //     await transaction({
  //       pool,
  //       inputs: [aliceDepositUtxo],
  //       outputs: [aliceChangeUtxo, bobReceiveUtxo],
  //       fee: relayerFee,
  //       relayer: relayer.address,
  //       recipient: recipientAddress,
  //     });

  //     const relayerBal = await token.balanceOf(relayer.address);
  //     // const recipientBal = await ethers.provider.getBalance(recipientAddress);
  //     // expect(recipientBal).to.be.equal(bobReceiveAmount);
  //     expect(relayerBal).to.be.equal(relayerFee);
  //   });
  // });
});
