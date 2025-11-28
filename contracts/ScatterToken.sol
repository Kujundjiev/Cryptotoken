// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ScatterToken is ERC20, ReentrancyGuard, Ownable {
    // Token variables
    uint256 private constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant LOCK_DURATION = 30 days;
    uint256 public constant PARTIAL_UNLOCK_DURATION = 12 hours;
    uint256 public constant PARTIAL_UNLOCK_PERCENT = 100; // 1% = 100 basis points

    // Staking related variable
    address public stakingContract;

    struct LockInfo {
        uint256 amount;
        uint256 lockTime;
        uint256 lastPartialUnlock;
        uint256 remainingAmount;
    }

    mapping(address => LockInfo) public userLocks;

    // Events
    event TokensLocked(address indexed user, uint256 amount);
    event TokensUnlocked(address indexed user, uint256 amount, string unlockType);
    event TokensBurned(address indexed burner, uint256 amount);

    constructor() ERC20("SCATTER", "SCATTER") Ownable() {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // Staking related functions
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid staking contract");
        stakingContract = _stakingContract;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can mint");
        _mint(to, amount);
    }

    // Existing functions...
    function lockTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        
        LockInfo storage lockInfo = userLocks[msg.sender];
        lockInfo.amount = amount;
        lockInfo.lockTime = block.timestamp;
        lockInfo.lastPartialUnlock = block.timestamp;
        lockInfo.remainingAmount = amount;
        
        emit TokensLocked(msg.sender, amount);
    }

    // ... rest of your existing functions ...
}