// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationToken
 * @dev ERC20 token for community reputation system
 */
contract ReputationToken is ERC20, Ownable {
    address public relayer;

    /**
     * @dev Constructor that gives the msg.sender all of the initial supply.
     * @param name The name of the token
     * @param symbol The symbol of the token
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {
        relayer = msg.sender; // Initially set relayer to contract deployer
    }

    /**
     * @dev Mint tokens to the contract itself
     * @param amount The amount of tokens to mint
     */
    function mint(uint256 amount) external onlyOwner {
        _mint(address(this), amount);
    }

    /**
     * @dev Set a new relayer address
     * @param _relayer The address of the new relayer
     */
    function setRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "ReputationToken: new relayer is the zero address");
        relayer = _relayer;
    }

    /**
     * @dev Transfer tokens from contract to multiple recipients equally
     * @param recipients Array of recipient addresses
     * @param amount Total amount to distribute equally among recipients
     */
    function transferTokens(address[] calldata recipients, uint256 amount) external {
        require(msg.sender == relayer, "ReputationToken: caller is not the relayer");
        require(recipients.length > 0, "ReputationToken: recipients array is empty");
        require(amount > 0, "ReputationToken: amount must be greater than 0");
        
        uint256 amountPerRecipient = amount / recipients.length;
        require(amountPerRecipient > 0, "ReputationToken: amount per recipient is 0");
        
        uint256 totalAmount = amountPerRecipient * recipients.length;
        require(totalAmount <= balanceOf(address(this)), "ReputationToken: insufficient balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "ReputationToken: recipient is the zero address");
            _transfer(address(this), recipients[i], amountPerRecipient);
        }
    }
}
