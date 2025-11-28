// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Scatt3rToken.sol";

contract ScatterStaking is Ownable, ReentrancyGuard {
    IERC20 public scatterToken;    // Main token (SCATTER)
    Scatt3rToken public scatt3rToken; // Governance token (SCATT3R)
    
    mapping(address => uint256) public lockedBalance;    // SCATTER locked
    mapping(address => uint256) public farmingBalance;   // SCATT3R in farming
    mapping(address => uint256) public farmingStartTime; // When user started farming
    
    uint256 public farmingRewardRate = 100; // Base APY rate (can be adjusted)
    bool public farmingEnabled = true;
    
    event TokensLocked(address indexed user, uint256 amount);
    event TokensUnlocked(address indexed user, uint256 amount);
    event StartedFarming(address indexed user, uint256 amount);
    event StoppedFarming(address indexed user, uint256 amount, uint256 reward);

    constructor(address _scatterToken, address _scatt3rToken) Ownable() {
        scatterToken = IERC20(_scatterToken);
        scatt3rToken = Scatt3rToken(_scatt3rToken);
    }

    // Lock SCATTER tokens and receive SCATT3R tokens
    function lockTokens(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot lock 0 tokens");
        require(
            scatterToken.balanceOf(msg.sender) >= _amount,
            "Insufficient SCATTER balance"
        );

        // Transfer SCATTER tokens to contract
        require(
            scatterToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        // Mint equal amount of SCATT3R tokens
        scatt3rToken.mint(msg.sender, _amount);
        
        lockedBalance[msg.sender] += _amount;
        emit TokensLocked(msg.sender, _amount);
    }

    // Start farming with SCATT3R tokens
    function startFarming(uint256 _amount) external nonReentrant {
        require(farmingEnabled, "Farming is not enabled");
        require(_amount > 0, "Cannot farm 0 tokens");
        require(
            scatt3rToken.balanceOf(msg.sender) >= _amount,
            "Insufficient SCATT3R balance"
        );

        // Transfer SCATT3R tokens to contract
        require(
            scatt3rToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        farmingBalance[msg.sender] += _amount;
        farmingStartTime[msg.sender] = block.timestamp;
        
        emit StartedFarming(msg.sender, _amount);
    }

    // Stop farming and claim rewards
    function stopFarming() external nonReentrant {
        uint256 farmedAmount = farmingBalance[msg.sender];
        require(farmedAmount > 0, "No tokens farming");
        
        // Calculate rewards
        uint256 reward = calculateFarmingReward(msg.sender);
        
        // Reset farming data
        farmingBalance[msg.sender] = 0;
        farmingStartTime[msg.sender] = 0;
        
        // Return SCATT3R tokens and rewards
        scatt3rToken.transfer(msg.sender, farmedAmount);
        scatterToken.transfer(msg.sender, reward); // Rewards are paid in SCATTER
        
        emit StoppedFarming(msg.sender, farmedAmount, reward);
    }

    function calculateFarmingReward(address _user) public view returns (uint256) {
        uint256 farmedAmount = farmingBalance[_user];
        if (farmedAmount == 0) return 0;
        
        uint256 farmingDuration = block.timestamp - farmingStartTime[_user];
        return (farmedAmount * farmingRewardRate * farmingDuration) / (365 days * 100);
    }

    // Admin function to adjust farming reward rate
    function setFarmingRewardRate(uint256 _newRate) external onlyOwner {
        farmingRewardRate = _newRate;
    }

    // Admin function to enable/disable farming
    function toggleFarming() external onlyOwner {
        farmingEnabled = !farmingEnabled;
    }
} 