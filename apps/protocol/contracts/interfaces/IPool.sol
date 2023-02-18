// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ProofArgs, ExtData} from "../helpers/DataTypes.sol";

interface IPool {
    event CommitmentInserted(bytes32 commitment, uint256 leafIndex, bytes encryptedOutput);
    event NullifierUsed(bytes32 nullifier);

    error InvalidTxProof();
    error UnknownMerkleRoot();
    error InputNullifierAlreadyUsed(bytes32 usedNullifier);
    error InvalidExtDataHash(bytes32 extDataHash);
    error InvalidPublicAmount(uint256 publicAmount);
    error InvalidAmount(uint256 amount);
    error ZeroRecipientAddress();
    error DepositAmountExceedsMaxLimit(uint256 amount, uint256 maxAmountAllowed);
    error FeeExceedsMaxLimit(uint256 fee, uint256 maxFeeAllowed);
    error ExtAmountExceedsMaxLimit(uint256 extAmount, uint256 maxExtAmountAllowed);
    error SanctionedAddress(address addr);

    function deposit(ProofArgs calldata args, ExtData calldata extData) external returns (uint256);

    function withdraw(ProofArgs calldata args, ExtData calldata extData) external returns (uint256);

    function transfer(ProofArgs calldata args, ExtData calldata extData) external;

    function verifyProof(ProofArgs calldata args) external view returns (bool);
}
