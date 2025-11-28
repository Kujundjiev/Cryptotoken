// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Scatt3rToken is ERC20, Ownable {
    address public stakingContract;

    constructor() ERC20("SCATT3R", "SCATT3R") Ownable() {}

    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid staking contract");
        stakingContract = _stakingContract;
    }

    // Only staking contract can mint SCATT3R tokens when users lock SCATTER
    function mint(address to, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can mint");
        _mint(to, amount);
    }
} 