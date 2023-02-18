// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../MerkleTree.sol";

contract MerkleTreeMock is Initializable, MerkleTree {
    constructor(uint32 numLevels_, address hasher_) MerkleTree(numLevels_, hasher_) {}

    function insert(bytes32 leaf1, bytes32 leaf2) public returns (uint32 index) {
        return _insert(leaf1, leaf2);
    }

    function initialize() external initializer {
        __MerkleTree_init();
    }
}
