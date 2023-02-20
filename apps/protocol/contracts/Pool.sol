// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./MerkleTree.sol";
import "./interfaces/IVerifier.sol";
import "./interfaces/IPool.sol";
import "./interfaces/ISanctionsList.sol";
import {TxType, ProofArgs, ExtData} from "./helpers/DataTypes.sol";

contract Pool is
    IPool,
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    MerkleTree,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    uint256 public constant MAX_EXT_AMOUNT = 2**248;
    uint256 public constant MAX_FEE = 2**248;

    ISanctionsList public immutable sanctionsList;

    IVerifier public immutable verifier2;
    IVerifier public immutable verifier16;
    IERC20 public immutable token;

    uint256 public maxDepositAmount;
    mapping(bytes32 => bool) public nullifierHashes;

    constructor(
        uint32 numLevels_,
        address hasher_,
        IERC20 token_,
        IVerifier verifier2_,
        IVerifier verifier16_,
        ISanctionsList sanctionsList_
    ) MerkleTree(numLevels_, hasher_) {
        token = token_;
        verifier2 = verifier2_;
        verifier16 = verifier16_;
        sanctionsList = sanctionsList_;
    }

    modifier onlyNonSanctioned() {
        if (isSanctioned(msg.sender)) {
            revert SanctionedAddress(msg.sender);
        }
        _;
    }

    function initialize(uint256 maxDepositAmount_) external initializer {
        maxDepositAmount = maxDepositAmount_;
        __MerkleTree_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    function deposit(ProofArgs calldata args, ExtData calldata extData)
        external
        onlyNonSanctioned
        returns (uint256)
    {
        if (extData.amount > maxDepositAmount) {
            revert DepositAmountExceedsMaxLimit(extData.amount, maxDepositAmount);
        }

        token.safeTransferFrom(msg.sender, address(this), extData.amount);

        _transact(TxType.DEPOSIT, args, extData);

        return extData.amount;
    }

    function withdraw(ProofArgs calldata args, ExtData calldata extData)
        external
        onlyNonSanctioned
        returns (uint256)
    {
        if (extData.recipient == address(0)) {
            revert ZeroRecipientAddress();
        }

        if (isSanctioned(extData.recipient)) {
            revert SanctionedAddress(extData.recipient);
        }

        _transact(TxType.WITHDRAW, args, extData);

        token.safeTransfer(extData.recipient, extData.amount);
        if (extData.fee > 0) {
            token.safeTransfer(extData.relayer, extData.fee);
        }

        return extData.amount;
    }

    function transfer(ProofArgs calldata args, ExtData calldata extData)
        external
        onlyNonSanctioned
    {
        _transact(TxType.TRANSFER, args, extData);

        if (extData.fee > 0) {
            token.safeTransfer(extData.relayer, extData.fee);
        }
    }

    function isSpent(bytes32 nullifierHash) public view returns (bool) {
        return nullifierHashes[nullifierHash];
    }

    function getPublicAmount(
        TxType txType,
        uint256 extAmount,
        uint256 fee
    ) public pure returns (uint256) {
        if (fee > MAX_FEE) {
            revert FeeExceedsMaxLimit(fee, MAX_FEE);
        }

        if (extAmount > MAX_EXT_AMOUNT) {
            revert ExtAmountExceedsMaxLimit(extAmount, MAX_EXT_AMOUNT);
        }

        uint256 publicAmount;
        if (txType == TxType.DEPOSIT) {
            publicAmount = extAmount;
        } else if (txType == TxType.WITHDRAW) {
            publicAmount = FIELD_SIZE - (extAmount + fee);
        } else if (txType == TxType.TRANSFER) {
            publicAmount = fee == 0 ? 0 : FIELD_SIZE - fee;
        } else {
            revert("Invalid TxType");
        }

        return publicAmount;
    }

    function verifyProof(ProofArgs memory args) public view returns (bool) {
        if (args.inputNullifiers.length == 2) {
            return
                verifier2.verifyProof(
                    args.proof.a,
                    args.proof.b,
                    args.proof.c,
                    [
                        uint256(args.root),
                        args.publicAmount,
                        uint256(args.extDataHash),
                        uint256(args.inputNullifiers[0]),
                        uint256(args.inputNullifiers[1]),
                        uint256(args.outputCommitments[0]),
                        uint256(args.outputCommitments[1])
                    ]
                );
        } else if (args.inputNullifiers.length == 16) {
            return
                verifier16.verifyProof(
                    args.proof.a,
                    args.proof.b,
                    args.proof.c,
                    [
                        uint256(args.root),
                        args.publicAmount,
                        uint256(args.extDataHash),
                        uint256(args.inputNullifiers[0]),
                        uint256(args.inputNullifiers[1]),
                        uint256(args.inputNullifiers[2]),
                        uint256(args.inputNullifiers[3]),
                        uint256(args.inputNullifiers[4]),
                        uint256(args.inputNullifiers[5]),
                        uint256(args.inputNullifiers[6]),
                        uint256(args.inputNullifiers[7]),
                        uint256(args.inputNullifiers[8]),
                        uint256(args.inputNullifiers[9]),
                        uint256(args.inputNullifiers[10]),
                        uint256(args.inputNullifiers[11]),
                        uint256(args.inputNullifiers[12]),
                        uint256(args.inputNullifiers[13]),
                        uint256(args.inputNullifiers[14]),
                        uint256(args.inputNullifiers[15]),
                        uint256(args.outputCommitments[0]),
                        uint256(args.outputCommitments[1])
                    ]
                );
        } else {
            revert("Unsupported input count");
        }
    }

    function isSanctioned(address addr) public view returns (bool) {
        return sanctionsList.isSanctioned(addr);
    }

    function _transact(
        TxType txType,
        ProofArgs memory args,
        ExtData memory extData
    ) internal nonReentrant {
        if (!isKnownRoot(args.root)) {
            revert UnknownMerkleRoot();
        }

        for (uint256 i = 0; i < args.inputNullifiers.length; i++) {
            if (isSpent(args.inputNullifiers[i])) {
                revert InputNullifierAlreadyUsed(args.inputNullifiers[i]);
            }
        }

        if (uint256(args.extDataHash) != uint256(keccak256(abi.encode(extData))) % FIELD_SIZE) {
            revert InvalidExtDataHash(args.extDataHash);
        }

        if (args.publicAmount != getPublicAmount(txType, extData.amount, extData.fee)) {
            revert InvalidPublicAmount(args.publicAmount);
        }

        if (!verifyProof(args)) {
            revert InvalidTxProof();
        }

        for (uint256 i = 0; i < args.inputNullifiers.length; ++i) {
            nullifierHashes[args.inputNullifiers[i]] = true;
        }

        _insert(args.outputCommitments[0], args.outputCommitments[1]);

        emit CommitmentInserted(
            args.outputCommitments[0],
            nextLeafIndex - 2,
            extData.encryptedOutput1
        );
        emit CommitmentInserted(
            args.outputCommitments[1],
            nextLeafIndex - 1,
            extData.encryptedOutput2
        );
        for (uint256 i = 0; i < args.inputNullifiers.length; ++i) {
            emit NullifierUsed(args.inputNullifiers[i]);
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
