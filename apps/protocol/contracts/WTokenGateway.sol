// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IWToken.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IWTokenGateway.sol";
import {ProofArgs, ExtData} from "./helpers/DataTypes.sol";

contract WTokenGateway is IWTokenGateway {
    IWToken public immutable wToken;

    constructor(address wToken_) {
        wToken = IWToken(wToken_);
    }

    function deposit(
        address pool,
        ProofArgs calldata args,
        ExtData calldata extData
    ) external payable {
        if (msg.value != extData.amount) {
            revert InvalidValueSent(msg.value, extData.amount);
        }

        wToken.deposit{value: extData.amount}();
        wToken.approve(pool, extData.amount);
        IPool(pool).deposit(args, extData);
    }

    function withdraw(
        address pool,
        address unwrappedTokenReceiver,
        ProofArgs calldata args,
        ExtData calldata extData
    ) external {
        if (extData.recipient != address(this)) {
            revert RecipientNotGateway(extData.recipient, address(this));
        }

        if (unwrappedTokenReceiver == address(0)) {
            revert ZeroRecipientAddress();
        }

        uint256 withdrawAmount = IPool(pool).withdraw(args, extData);

        wToken.approve(address(wToken), withdrawAmount);
        wToken.withdraw(withdrawAmount);

        _safeTransferETH(unwrappedTokenReceiver, withdrawAmount);
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }

    receive() external payable {}
}
