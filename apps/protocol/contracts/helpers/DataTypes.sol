// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

enum TxType {
    DEPOSIT,
    WITHDRAW,
    TRANSFER
}

struct ExtData {
    address recipient;
    uint256 amount;
    address relayer;
    uint256 fee;
    bytes encryptedOutput1;
    bytes encryptedOutput2;
}

struct Proof {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
}

struct ProofArgs {
    Proof proof;
    bytes32 root;
    bytes32[] inputNullifiers;
    bytes32[2] outputCommitments;
    uint256 publicAmount;
    bytes32 extDataHash;
}
