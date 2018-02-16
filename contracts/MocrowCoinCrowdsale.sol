pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/lifecycle/Pausable.sol';

import "./MocrowCoin.sol";
import "./Whitelistable.sol";

contract MocrowCoinCrowdsale is Whitelistable, Pausable {
    using SafeMath for uint256;

    uint256 constant public DECIMALS = 18;

    uint256 constant public HARDCAP_TOKENS_PRE_ICO = 36000000 * (10 ** DECIMALS);
    uint256 constant public HARDCAP_TOKENS_ICO = 84000000 * (10 ** DECIMALS);
    uint256 constant public COMPAIGN_ALLOCATION_AND_BONUSES_TOKENS = 11725883 * (10 ** DECIMALS);

    uint256 constant public TOKEN_RATE_PRE_ICO = 17934; // 0.00017934
    uint256 constant public TOKEN_RATE_ICO = 35868; // 0.00035868

    uint256 constant public MINIMAL_INVESTMENT = 0.1 ether; // 1 * (10 ** (DECIMALS - 1))
    uint256 constant public MAXIMAL_INVESTMENT = 5 ether; // 13 * (10 ** DECIMALS)

    uint256 constant public MINIMAL_TEN_PERCENT_BONUS_BY_VALUE = 3.5 ether;
    uint256 constant public MINIMAL_FIVE_PERCENT_BONUS_BY_VALUE = 2.5 ether;

    mapping(address => uint256) public investmentsPreIco;
    address[] private investorsPreIco;

    mapping(address => uint256) public investmentsIco;
    address[] private investorsIco;

    uint256 public preIcoDurationDays = 10;
    uint256 public startTimePreIco;
    uint256 public endTimePreIco;

    uint256 public daysDelayAfterPreIco = 10;

    uint256 public icoDurationDays = 60;
    uint256 public startTimeIco;
    uint256 public endTimeIco;

    uint256 public icoTenPercentBonusEnded;
    uint256 public icoFivePercentBonusEnded;

    address private withdrawalWallet1;
    address private withdrawalWallet2;
    address private withdrawalWallet3;
    address private withdrawalWallet4;

    uint256 public withdrawalWallet1Percent = 50;
    uint256 public withdrawalWallet2Percent = 20;
    uint256 public withdrawalWallet3Percent = 15;
    uint256 public withdrawalWallet4Percent = 15;

    address private addressForCampaignAllocation;
    address private addressForUnsoldTokens;

    uint256 public preIcoTokenRateNegativeDecimals = 8;
    uint256 public preIcoTokenRate = TOKEN_RATE_PRE_ICO;
    uint256 public lastDayChangePreIcoTokenRate = 0;
    uint256 public tokensRemainingPreIco = HARDCAP_TOKENS_PRE_ICO;

    uint256 public icoTokenRateNegativeDecimals = 8;
    uint256 public icoTokenRate = TOKEN_RATE_ICO;
    uint256 public lastDayChangeIcoTokenRate = 0;
    uint256 public tokensRemainingIco = HARDCAP_TOKENS_PRE_ICO + HARDCAP_TOKENS_ICO;

    uint256 public compaignAllocationAndBonusRemainingTokens = COMPAIGN_ALLOCATION_AND_BONUSES_TOKENS;

    bool public isUnsoldTokensTransfered = false;
    bool public isRemainingCompaignAllocationAndBonusTokensTransfered = false;

    MocrowCoin public token;

    modifier beforePreIcoSalePeriod() {
        require(now < startTimePreIco);
        _;
    }

    modifier beforeIcoSalePeriod() {
        require(now < startTimeIco);
        _;
    }

    modifier preIcoSalePeriod () {
        require(startTimePreIco < now && now < endTimePreIco);
        _;
    }

    modifier icoSalePeriod() {
        require(startTimeIco < now && now < endTimeIco);
        _;
    }

    modifier afterIcoSalePeriod() {
        require(endTimeIco < now);
        _;
    }

    modifier minimalInvestment() {
        require(msg.value > MINIMAL_INVESTMENT);
        _;
    }

    function MocrowCoinCrowdsale(
        address _withdrawalWallet1,
        address _withdrawalWallet2,
        address _withdrawalWallet3,
        address _withdrawalWallet4,
        address _addressForPlatformOperations,
        address _addressForFounders,
        address _addressForBountyProgram,
        address _addressForCampaignAllocation,
        address _addressForUnsoldTokens,
        uint256 _startTimePreIco
    ) public {
        require(_withdrawalWallet1 != address(0) &&
        _withdrawalWallet2 != address(0) &&
        _withdrawalWallet3 != address(0) &&
        _withdrawalWallet4 != address(0) &&
        _addressForPlatformOperations != address(0) &&
        _addressForFounders != address(0) &&
        _addressForBountyProgram != address(0) &&
        _addressForCampaignAllocation != address(0) &&
        _addressForUnsoldTokens != address(0) &&
        _startTimePreIco > now
        );

        startTimePreIco = _startTimePreIco;
        endTimePreIco = startTimePreIco + (preIcoDurationDays * 1 days);

        startTimeIco = endTimePreIco + (daysDelayAfterPreIco * 1 days);
        endTimeIco = startTimeIco + (icoDurationDays * 1 days);

        icoTenPercentBonusEnded = startTimeIco + (2 days);
        icoFivePercentBonusEnded = icoTenPercentBonusEnded + (3 days);

        withdrawalWallet1 = _withdrawalWallet1;
        withdrawalWallet2 = _withdrawalWallet2;
        withdrawalWallet3 = _withdrawalWallet3;
        withdrawalWallet4 = _withdrawalWallet4;

        token = new MocrowCoin(_addressForPlatformOperations, _addressForFounders, _addressForBountyProgram);
        addressForCampaignAllocation = _addressForCampaignAllocation;
        addressForUnsoldTokens = _addressForUnsoldTokens;
        //        whitelist.transferOwnership(msg.sender);
        //        token.transferOwnership(msg.sender);
    }


    function changePreIcoStartTime(uint256 _startTimePreIco) onlyAdministratorOrOwner beforePreIcoSalePeriod public {
        require(now < _startTimePreIco);
        uint256 _endTimePreIco = _startTimePreIco + (preIcoDurationDays * 1 days);
        require(_endTimePreIco < startTimeIco);

        startTimePreIco = _startTimePreIco;
        endTimePreIco = _endTimePreIco;
    }

    function changeIcoStartTime(uint256 _startTimeIco) onlyAdministratorOrOwner beforeIcoSalePeriod public {
        require(_startTimeIco > now && _startTimeIco > endTimePreIco);

        startTimeIco = _startTimeIco;
        endTimeIco = startTimeIco + (icoDurationDays * 1 days);
    }

    function changePreIcoTokenRate(uint256 _preIcoTokenRate, uint256 _negativeDecimals) onlyAdministratorOrOwner public {
        uint256 dayNumber = now / (1 days);
        require(dayNumber != lastDayChangePreIcoTokenRate);

        preIcoTokenRate = _preIcoTokenRate;
        preIcoTokenRateNegativeDecimals = _negativeDecimals;
        lastDayChangePreIcoTokenRate = dayNumber;
    }

    function changeIcoTokenRate(uint256 _icoTokenRate, uint256 _negativeDecimals) onlyAdministratorOrOwner public {
        uint256 dayNumber = now / (1 days);
        require(dayNumber != lastDayChangeIcoTokenRate);

        icoTokenRate = _icoTokenRate;
        icoTokenRateNegativeDecimals = _negativeDecimals;
        lastDayChangeIcoTokenRate = dayNumber;
    }

    /**
    * @dev called by the owner or administrator to pause, triggers stopped state
    */
    function pause() onlyAdministratorOrOwner whenNotPaused public {
        paused = true;
        Pause();
    }

    /**
    * @dev called by the owner or administrator to unpause, returns to normal state
    */
    function unpause() onlyAdministratorOrOwner whenPaused public {
        paused = false;
        Unpause();
    }

    function withdrawalWalletsTransfer(uint256 value) private {
        uint256 withdrawalWallet1Value = withdrawalWallet1Percent.mul(value).div(100);
        uint256 withdrawalWallet2Value = withdrawalWallet2Percent.mul(value).div(100);
        uint256 withdrawalWallet3Value = withdrawalWallet3Percent.mul(value).div(100);
        uint256 withdrawalWallet4Value = value.sub(withdrawalWallet1Value.add(withdrawalWallet2Value).add(withdrawalWallet3Value));
        withdrawalWallet1.transfer(withdrawalWallet1Value);
        withdrawalWallet2.transfer(withdrawalWallet2Value);
        withdrawalWallet3.transfer(withdrawalWallet3Value);
        withdrawalWallet4.transfer(withdrawalWallet4Value);
    }

//    function dropTokensRemaining() public {
//        tokensRemainingPreIco = 0;
//        tokensRemainingIco = 0;
//    }
//
//    function dropTokensRemainingPreIcoToMinimum() public {
//        tokensRemainingPreIco = 11152 * (10 ** 18);
//        tokensRemainingIco = HARDCAP_TOKENS_ICO + tokensRemainingPreIco;
//    }
//
//    function dropTokensRemainingIcoToMinimum() public {
//        tokensRemainingPreIco = 0;
//        tokensRemainingIco = 5576 * (10 ** 18);
//    }

    /**
    * @dev Sell tokens during pre-ICO.
    * @dev Sell tokens only for whitelisted wallets.
    */
    function sellTokensPreIco() preIcoSalePeriod whenWhitelisted whenNotPaused minimalInvestment public payable {
        require(tokensRemainingPreIco > 0);
        uint256 tokensAmount = msg.value.div(preIcoTokenRate).mul(10 ** preIcoTokenRateNegativeDecimals);
        uint256 excessiveFunds = 0;
        uint256 weiAmount = msg.value;

        if (tokensRemainingPreIco < tokensAmount) {
            uint256 tokensDifferent = tokensAmount.sub(tokensRemainingPreIco);
            excessiveFunds = tokensDifferent.mul(preIcoTokenRate).div(10 ** icoTokenRateNegativeDecimals);

            weiAmount = weiAmount.sub(excessiveFunds);
            tokensAmount = tokensRemainingPreIco;
        }

        tokensRemainingPreIco = tokensRemainingPreIco.sub(tokensAmount);
        tokensRemainingIco = tokensRemainingIco.sub(tokensAmount);

        if (investmentsPreIco[msg.sender] == 0) {
            investorsPreIco.push(msg.sender);
        }
        investmentsPreIco[msg.sender] = investmentsPreIco[msg.sender].add(weiAmount);

        withdrawalWalletsTransfer(weiAmount);
        token.transfer(msg.sender, tokensAmount);

        if (excessiveFunds > 0) {
            msg.sender.transfer(excessiveFunds);
        }
    }

    /**
    * @dev Sell tokens during ICO.
    * @dev Sell tokens only for whitelisted wallets.
    */
    function sellTokensIco() icoSalePeriod whenWhitelisted whenNotPaused minimalInvestment public payable {
        require(tokensRemainingIco > 0);
        uint256 bonusTokens = 0;
        uint256 excessiveFunds = 0;
        uint256 weiAmount = msg.value;

        if (msg.value > MAXIMAL_INVESTMENT) {
            weiAmount = MAXIMAL_INVESTMENT;
            excessiveFunds = msg.value.sub(MAXIMAL_INVESTMENT);
        }

        uint256 tokensAmount = weiAmount.div(icoTokenRate).mul(10 ** icoTokenRateNegativeDecimals);

        if (tokensRemainingIco < tokensAmount) {
            uint256 tokensDifferent = tokensAmount.sub(tokensRemainingIco);
            excessiveFunds = excessiveFunds.add(tokensDifferent.mul(icoTokenRate).div(10 ** icoTokenRateNegativeDecimals));

            weiAmount = weiAmount.sub(excessiveFunds);
            tokensAmount = tokensRemainingIco;
        }

        if (compaignAllocationAndBonusRemainingTokens > 0) {
            uint bonus = 0;
            if (now < icoTenPercentBonusEnded) {
                bonus = bonus + 10;
            } else if (now < icoFivePercentBonusEnded) {
                bonus = bonus + 5;
            }

            if (weiAmount >= MINIMAL_TEN_PERCENT_BONUS_BY_VALUE) {
                bonus = bonus + 10;
            } else if (weiAmount >= MINIMAL_FIVE_PERCENT_BONUS_BY_VALUE) {
                bonus = bonus + 5;
            }

            bonusTokens = tokensAmount.mul(bonus).div(100);

            if (compaignAllocationAndBonusRemainingTokens < bonusTokens) {
                bonusTokens = compaignAllocationAndBonusRemainingTokens;
            }
            compaignAllocationAndBonusRemainingTokens = compaignAllocationAndBonusRemainingTokens.sub(bonusTokens);
        }

        tokensRemainingIco = tokensRemainingIco.sub(tokensAmount);
        tokensAmount = tokensAmount.add(bonusTokens);

        if (investmentsIco[msg.sender] == 0) {
            investorsIco.push(msg.sender);
        }

        investmentsIco[msg.sender] = investmentsIco[msg.sender].add(weiAmount);
        withdrawalWalletsTransfer(weiAmount);
        token.transfer(msg.sender, tokensAmount);

        if (excessiveFunds > 0) {
            msg.sender.transfer(excessiveFunds);
        }
    }

    function transferRemainingCompaignAllocationAndBonusTokens() onlyAdministratorOrOwner afterIcoSalePeriod public {
        require(!isRemainingCompaignAllocationAndBonusTokensTransfered);
        token.transfer(addressForCampaignAllocation, compaignAllocationAndBonusRemainingTokens);
        isRemainingCompaignAllocationAndBonusTokensTransfered = true;
        if (isRemainingCompaignAllocationAndBonusTokensTransfered && isUnsoldTokensTransfered) {
            token.transferOwnership(owner);
            whitelist.transferOwnership(owner);
        }
    }

    function transferUnsoldTokens() onlyAdministratorOrOwner afterIcoSalePeriod public {
        require(!isUnsoldTokensTransfered);
        token.transfer(addressForUnsoldTokens, tokensRemainingIco);
        isUnsoldTokensTransfered = true;
        if (isRemainingCompaignAllocationAndBonusTokensTransfered && isUnsoldTokensTransfered) {
            token.transferOwnership(owner);
            whitelist.transferOwnership(owner);
        }
    }
}