// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ProofArgs, ExtData} from "../helpers/DataTypes.sol";

interface IWTokenGateway {
    error ZeroRecipientAddress();
    error InvalidValueSent(uint256 sent, uint256 required);
    error RecipientNotGateway(address recipient, address gateway);

    function deposit(
        address pool,
        ProofArgs calldata args,
        ExtData calldata extData
    ) external payable;

    function withdraw(
        address pool,
        address unwrappedTokenReceiver,
        ProofArgs calldata args,
        ExtData calldata extData
    ) external;
}
