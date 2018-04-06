import {
  EVMThrow,
  assertEqual,
  assertTrue,
  ether,
  ethBalance,
  timeController,
  assertExpectedError,
  assertEqualBigNumbers,
} from './utils';
import {
  compaignAllocationAndBonusesTokens,
  tokensRemainingIco,
  getDefaultWallets,
} from './utils/constants';

const MocrowCoin = artifacts.require('MocrowCoin');
const MocrowCoinCrowdsale = artifacts.require('MocrowCoinCrowdsale');
const Whitelist = artifacts.require('Whitelist');

// Commented tests work only with some functions,
// which must be included into contract in dev mode, BUT NOT IN PRODUCTION!
contract('MocrowCoinCrowdsale', (wallets) => {
  const {
    owner,
    founders,
    bountyProgram,
    withdrawal1,
    withdrawal2,
    withdrawal3,
    withdrawal4,
    client1,
    client2,
    client3,
  } = getDefaultWallets(wallets);

  const oneDayInSeconds = 24 * 60 * 60;
  const preIcoStartShift = 1000;
  const shiftBeforeIco = preIcoStartShift / 100;
  const preIcoDurationDays = 10;
  const preIcoDuration = preIcoDurationDays * oneDayInSeconds;
  const preIcoEnd = preIcoStartShift + preIcoDuration;

  const delayAfterPreIcoDays = 10;
  const delayAfterPreIco = delayAfterPreIcoDays * oneDayInSeconds;

  const icoStartShift = preIcoEnd + delayAfterPreIco;
  const icoDurationDays = 60;
  const icoDuration = 60 * oneDayInSeconds;
  const icoEnd = icoStartShift + icoDuration;

  const tokenRatePreIco = 0.00017934;
  const preIcoTokenRateNegativeDecimals = 8;
  const preIcoTokenRateDivisor = 10 ** preIcoTokenRateNegativeDecimals;

  const tokenRateIco = 0.00035868;
  const icoTokenRateNegativeDecimals = 8;
  const icoTokenRateDivisor = 10 ** icoTokenRateNegativeDecimals;

  const preIcoHardcap = 36e24;
  const icoHardcap = 84e24;

  const withdrawal1Percent = 50;
  const withdrawal2Percent = 20;
  const withdrawal3Percent = 15;
  const withdrawal4Percent = 15;

  const minimalInvestment = ether(0.1);
  const maximalInvestment = ether(5);

  const purchaseOneEth = ether(1);
  const purchaseHalfEth = ether(0.5);

  const bonus1 = 0.05;
  const bonus2 = 0.1;
  const fivePercentBonusDuration = 3 * oneDayInSeconds;
  const tenPercentBonusDuration = 2 * oneDayInSeconds;
  const minimalFivePercentBonusByValue = ether(2.5);
  const minimalTenPercentBonusByValue = ether(3.5);

  const getDefaultPreIcoDates = () => {
    const startTimePreIco = timeController.currentTimestamp().add(preIcoStartShift).toNumber();
    const endTimePreIco = timeController.currentTimestamp().add(preIcoEnd).toNumber();
    return { startTimePreIco, endTimePreIco };
  };

  const getPastTime = () => timeController.currentTimestamp().sub(100).toNumber();

  const getDays = () =>
    Math.floor(timeController.currentTimestamp().div(oneDayInSeconds).toNumber());

  const getDefaultIcoDates = () => {
    const startTimeIco = timeController.currentTimestamp().add(icoStartShift).toNumber();
    const endTimeIco = timeController.currentTimestamp().add(icoEnd).toNumber();
    return { startTimeIco, endTimeIco };
  };

  describe('initial variables and constants', function () {
    const { startTimePreIco, endTimePreIco } = getDefaultPreIcoDates();
    const { startTimeIco, endTimeIco } = getDefaultIcoDates();
    before(async () => {
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        founders,
        bountyProgram,
        startTimePreIco,
      );
      this.token = MocrowCoin.at(await this.crowdsale.token());
      this.whitelist = Whitelist.at(await this.crowdsale.whitelist());
    });
    it('pre-ICO hardcap', async () => {
      const actualPreIcoHardcap = (await this.crowdsale.HARDCAP_TOKENS_PRE_ICO()).toNumber();
      assertEqual(actualPreIcoHardcap, preIcoHardcap);
    });

    it('ICO hardcap', async () => {
      const actualIcoHardcap = (await this.crowdsale.HARDCAP_TOKENS_ICO()).toNumber();
      assertEqual(actualIcoHardcap, icoHardcap);
    });

    it('crowdsale owner', async () => {
      const ownerCrowdsale = await this.crowdsale.owner();
      assertEqual(ownerCrowdsale, owner);
    });

    it('whitelist owner', async () => {
      const ownerWhitelist = await this.whitelist.owner();
      assertEqual(ownerWhitelist, this.crowdsale.address);
    });

    it('token owner', async () => {
      const ownerToken = await this.token.owner();
      assertEqual(ownerToken, this.crowdsale.address);
    });

    it('start time pre-ICO', async () => {
      const actualStartTimePreIco = (await this.crowdsale.startTimePreIco()).toNumber();
      assertEqual(actualStartTimePreIco, startTimePreIco);
    });

    it('end time pre-ICO', async () => {
      const actualEndTimePreIco = (await this.crowdsale.endTimePreIco()).toNumber();
      assertEqual(actualEndTimePreIco, endTimePreIco);
    });

    it('start time ICO', async () => {
      const actualStartTimeIco = (await this.crowdsale.startTimeIco()).toNumber();
      assertEqual(actualStartTimeIco, startTimeIco);
    });

    it('end time ICO', async () => {
      const actualEndTimeIco = (await this.crowdsale.endTimeIco()).toNumber();
      assertEqual(actualEndTimeIco, endTimeIco);
    });

    it('tokens remaining pre-ICO', async () => {
      const actualTokensRemainingPreIco = (await this.crowdsale.tokensRemainingPreIco()).toNumber();
      assertEqual(actualTokensRemainingPreIco, preIcoHardcap);
    });

    it('tokens remaining ICO (sum of pre-ICO hardcap and ICO hardcap)', async () => {
      const actualTokensRemainingIco = (await this.crowdsale.tokensRemainingIco()).toNumber();
      assertEqual(actualTokensRemainingIco, preIcoHardcap + icoHardcap);
    });

    it('token rate pre-ICO', async () => {
      const actualTokenRatePreIco = (await this.crowdsale.TOKEN_RATE_PRE_ICO()).toNumber();
      assertEqual(actualTokenRatePreIco, tokenRatePreIco * preIcoTokenRateDivisor);
    });

    it('token rate ICO', async () => {
      const actualTokenRateIco = (await this.crowdsale.TOKEN_RATE_ICO()).toNumber();
      assertEqual(actualTokenRateIco, tokenRateIco * icoTokenRateDivisor);
    });

    it('pre-ICO token rate negative decimals', async () => {
      const actualPreIcoTokenRateNegativeDecimals = (
        await this.crowdsale.preIcoTokenRateNegativeDecimals()).toNumber();
      assertEqual(actualPreIcoTokenRateNegativeDecimals, preIcoTokenRateNegativeDecimals);
    });

    it('ICO token rate negative decimals', async () => {
      const actualIcoTokenRateNegativeDecimals = (
        await this.crowdsale.icoTokenRateNegativeDecimals()).toNumber();
      assertEqual(actualIcoTokenRateNegativeDecimals, icoTokenRateNegativeDecimals);
    });

    it('pre-ICO duration days', async () => {
      const actualPreIcoDurationDays = (await this.crowdsale.preIcoDurationDays()).toNumber();
      assertEqual(actualPreIcoDurationDays, preIcoDurationDays);
    });

    it('ICO duration days', async () => {
      const actualIcoDurationDays = (await this.crowdsale.icoDurationDays()).toNumber();
      assertEqual(actualIcoDurationDays, icoDurationDays);
    });

    it('days delay after pre ICO', async () => {
      const actualDelayAfterPreIcoDays = (await this.crowdsale.daysDelayAfterPreIco()).toNumber();
      assertEqual(actualDelayAfterPreIcoDays, delayAfterPreIcoDays);
    });

    it('minimal investment', async () => {
      const actualMinimalInvestment = (await this.crowdsale.MINIMAL_INVESTMENT()).toNumber();
      assertEqual(actualMinimalInvestment, minimalInvestment.toNumber());
    });

    it('maximal investment', async () => {
      const actualMaximalInvestment = (await this.crowdsale.MAXIMAL_INVESTMENT()).toNumber();
      assertEqual(actualMaximalInvestment, maximalInvestment.toNumber());
    });

    it('minimal 10 percent bonus by value', async () => {
      const actualMinimalTenPercentBonusByValue = (
        await this.crowdsale.MINIMAL_TEN_PERCENT_BONUS_BY_VALUE()).toNumber();
      assertEqual(actualMinimalTenPercentBonusByValue, minimalTenPercentBonusByValue.toNumber());
    });

    it('minimal 5 percent bonus by value', async () => {
      const actualMinimalFivePercentBonusByValue = (
        await this.crowdsale.MINIMAL_FIVE_PERCENT_BONUS_BY_VALUE()).toNumber();
      assertEqual(actualMinimalFivePercentBonusByValue, minimalFivePercentBonusByValue.toNumber());
    });

    it('ico 10 percent bonus ended', async () => {
      const icoTenPercentBonusEnded = startTimeIco + (2 * oneDayInSeconds);
      const actualIcoTenPercentBonusEnded = (
        await this.crowdsale.icoTenPercentBonusEnded()).toNumber();
      assertEqual(actualIcoTenPercentBonusEnded, icoTenPercentBonusEnded);
    });

    it('ico 5 percent bonus ended', async () => {
      const icoFivePercentBonusEnded = startTimeIco + (5 * oneDayInSeconds);
      const actualIcoFivePercentBonusEnded = (
        await this.crowdsale.icoFivePercentBonusEnded()).toNumber();
      assertEqual(actualIcoFivePercentBonusEnded, icoFivePercentBonusEnded);
    });

    it('withdrawal wallet 1 in percent', async () => {
      const withdrawalWallet1Percent = (await this.crowdsale.withdrawalWallet1Percent()).toNumber();
      assertEqual(withdrawalWallet1Percent, withdrawal1Percent);
    });

    it('withdrawal wallet 2 in percent', async () => {
      const withdrawalWallet2Percent = (await this.crowdsale.withdrawalWallet2Percent()).toNumber();
      assertEqual(withdrawalWallet2Percent, withdrawal2Percent);
    });

    it('withdrawal wallet 3 in percent', async () => {
      const withdrawalWallet3Percent = (await this.crowdsale.withdrawalWallet3Percent()).toNumber();
      assertEqual(withdrawalWallet3Percent, withdrawal3Percent);
    });

    it('withdrawal wallet 4 in percent', async () => {
      const withdrawalWallet4Percent = (await this.crowdsale.withdrawalWallet4Percent()).toNumber();
      assertEqual(withdrawalWallet4Percent, withdrawal4Percent);
    });
  });
  describe('#MocrowCoinCrowdsale() - constructor', () => {
    describe('wrong parameters:', () => {
      const { startTimePreIco } = getDefaultPreIcoDates();

      it('withdrawal wallet 1 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          0x0,
          withdrawal2,
          withdrawal3,
          withdrawal4,
          client3,
          founders,
          bountyProgram,
          founders,
          bountyProgram,
          startTimePreIco,
        ));
      });
      it('withdrawal wallet 2 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          0x0,
          withdrawal3,
          withdrawal4,
          client3,
          founders,
          bountyProgram,
          founders,
          bountyProgram,
          startTimePreIco,
        ));
      });
      it('withdrawal wallet 3 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          0x0,
          withdrawal4,
          client3,
          founders,
          bountyProgram,
          founders,
          bountyProgram,
          startTimePreIco,
        ));
      });
      it('withdrawal wallet 4 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          withdrawal3,
          0x0,
          client3,
          founders,
          bountyProgram,
          founders,
          bountyProgram,
          startTimePreIco,
        ));
      });
      it('platform operations wallet 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          withdrawal3,
          withdrawal4,
          0x0,
          founders,
          bountyProgram,
          founders,
          bountyProgram,
          startTimePreIco,
        ));
      });
      it('founders wallet 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          withdrawal3,
          withdrawal4,
          client3,
          0x0,
          bountyProgram,
          founders,
          bountyProgram,
          startTimePreIco,
        ));
      });
      it('bounty programs wallet 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          withdrawal3,
          withdrawal4,
          client3,
          founders,
          0x0,
          founders,
          bountyProgram,
          startTimePreIco,
        ));
      });
      it('campaign allocation wallet 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          withdrawal3,
          withdrawal4,
          client3,
          founders,
          bountyProgram,
          0x0,
          bountyProgram,
          startTimePreIco,
        ));
      });
      it('unsold tokens wallet 0x0', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          withdrawal3,
          withdrawal4,
          client3,
          founders,
          bountyProgram,
          founders,
          0x0,
          startTimePreIco,
        ));
      });
      it('startTimePreIco empty', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          withdrawal3,
          withdrawal4,
          client3,
          founders,
          bountyProgram,
          founders,
          bountyProgram,
          0x0,
        ));
      });
      it('startTimePreIco < now', async () => {
        await assertExpectedError(MocrowCoinCrowdsale.new(
          withdrawal1,
          withdrawal2,
          withdrawal3,
          withdrawal4,
          client3,
          founders,
          bountyProgram,
          founders,
          bountyProgram,
          getPastTime(),
        ));
      });
    });
  });

  describe('#changePreIcoStartTime()', function () {
    beforeEach(async () => {
      const { startTimePreIco, endTimePreIco } = getDefaultPreIcoDates();
      const { endTimeIco } = getDefaultIcoDates();
      this.startTimePreIco = startTimePreIco;
      this.endTimeIco = endTimeIco;
      this.endTimePreIco = endTimePreIco;
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        founders,
        bountyProgram,
        startTimePreIco,
      );
    });
    describe('wrong parameters:', () => {
      beforeEach(async () => {
        this.timeWasntChanged = (async () => {
          const actualStartTimePreIco = (await this.crowdsale.startTimePreIco()).toNumber();
          assertEqual(actualStartTimePreIco, this.startTimePreIco);

          const actualEndTimePreIco = (await this.crowdsale.endTimePreIco()).toNumber();
          assertEqual(actualEndTimePreIco, this.endTimePreIco);
        });
      });
      it('_startTimePreIco < now', async () => {
        const changePreIcoStartTime =
          this.crowdsale.changePreIcoStartTime(getPastTime(), { from: owner });
        await changePreIcoStartTime.should.be.rejectedWith(EVMThrow);
        await this.timeWasntChanged();
      });
      it('not owner or administrator', async () => {
        const duringPreIco = this.startTimePreIco + oneDayInSeconds;
        const changePreIcoStartTime =
          this.crowdsale.changePreIcoStartTime(duringPreIco, { from: client1 });
        await changePreIcoStartTime.should.be.rejectedWith(EVMThrow);
        await this.timeWasntChanged();
      });
      it('not before pre-ICO sale period', async () => {
        const duringPreIco = this.startTimePreIco + oneDayInSeconds;
        await timeController.addSeconds(preIcoStartShift); // preICO was already started
        const changePreIcoStartTime =
          this.crowdsale.changePreIcoStartTime(duringPreIco, { from: owner });
        await changePreIcoStartTime.should.be.rejectedWith(EVMThrow);
        await this.timeWasntChanged();
      });
      it('_endTimePreIco >= startTimeIco', async () => {
        const afterPreIco = this.endTimePreIco + delayAfterPreIco;
        const changePreIcoStartTime =
          this.crowdsale.changePreIcoStartTime(afterPreIco, { from: owner });
        await changePreIcoStartTime.should.be.rejectedWith(EVMThrow);
        await this.timeWasntChanged();
      });
    });
    describe('right parameters:', () => {
      it('changed startTimePreIco & endTimePreIco', async () => {
        await timeController.addSeconds(shiftBeforeIco);
        const newStartTimePreIco = this.startTimePreIco + oneDayInSeconds;
        await this.crowdsale.changePreIcoStartTime(newStartTimePreIco, { from: owner });

        const actualStartTimePreIco = (await this.crowdsale.startTimePreIco()).toNumber();
        assertEqual(actualStartTimePreIco, newStartTimePreIco);

        const actualEndTimeIco = (await this.crowdsale.endTimePreIco()).toNumber();
        assertEqual(actualEndTimeIco, this.endTimePreIco + oneDayInSeconds);
      });
    });
  });

  describe('#changeIcoStartTime()', function () {
    beforeEach(async () => {
      const { startTimePreIco, endTimePreIco } = getDefaultPreIcoDates();
      const { startTimeIco, endTimeIco } = getDefaultIcoDates();
      this.startTimePreIco = startTimePreIco;
      this.endTimePreIco = endTimePreIco;
      this.startTimeIco = startTimeIco;
      this.endTimeIco = endTimeIco;
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        founders,
        bountyProgram,
        startTimePreIco,
      );
    });
    describe('wrong parameters:', () => {
      beforeEach(async () => {
        this.timeWasntChanged = (async () => {
          const actualStartTimeIco = (await this.crowdsale.startTimeIco()).toNumber();
          assertEqual(actualStartTimeIco, this.startTimeIco);

          const actualEndTimeIco = (await this.crowdsale.endTimeIco()).toNumber();
          assertEqual(actualEndTimeIco, this.endTimeIco);
        });
      });
      it('_startTimeIco < now', async () => {
        const changePreIcoStartTime =
          this.crowdsale.changeIcoStartTime(getPastTime(), { from: owner });
        await changePreIcoStartTime.should.be.rejectedWith(EVMThrow);
        await this.timeWasntChanged();
      });
      it('_startTimeIco < endTimePreIco', async () => {
        const changePreIcoStartTime =
          this.crowdsale.changeIcoStartTime(this.endTimePreIco - oneDayInSeconds, { from: owner });
        await changePreIcoStartTime.should.be.rejectedWith(EVMThrow);
        await this.timeWasntChanged();
      });
      it('not owner or administrator', async () => {
        const changePreIcoStartTime =
          this.crowdsale.changeIcoStartTime(this.startTimeIco + oneDayInSeconds, { from: client1 });
        await changePreIcoStartTime.should.be.rejectedWith(EVMThrow);
        await this.timeWasntChanged();
      });
      it('not before ICO sale period', async () => {
        await timeController.addSeconds(icoStartShift); // ICO was already started
        const changePreIcoStartTime =
          this.crowdsale.changeIcoStartTime(this.startTimeIco + oneDayInSeconds, { from: owner });
        await changePreIcoStartTime.should.be.rejectedWith(EVMThrow);
        await this.timeWasntChanged();
      });
    });
    describe('right parameters:', () => {
      it('changed startTimePreIco & endTimePreIco', async () => {
        await timeController.addSeconds(preIcoStartShift + oneDayInSeconds); // in time of pre-ICO
        const newShift = (100 * oneDayInSeconds); // shift on 100 days. Total 110 days delay
        const newIcoStartTime = this.startTimeIco + newShift;
        await this.crowdsale.changeIcoStartTime(newIcoStartTime, { from: owner });

        const actualStartTimeIco = (await this.crowdsale.startTimeIco()).toNumber();
        assertEqual(actualStartTimeIco, newIcoStartTime);

        const actualEndTimeIco = (await this.crowdsale.endTimeIco()).toNumber();
        assertEqual(actualEndTimeIco, this.endTimeIco + newShift);
      });
    });
  });

  describe('#changePreIcoTokenRate()', function () {
    const newTokenRate1 = 1234;
    const newNegativeDecimals1 = 5;
    const newTokenRate2 = 4321;
    const newNegativeDecimals2 = 2;
    const positiveResult = async (newTokenRate, newNegativeDecimals) => {
      const actualPreIcoTokenRate = (await this.crowdsale.preIcoTokenRate()).toNumber();
      assertEqual(actualPreIcoTokenRate, newTokenRate);

      const actualPreIcoTokenRateNegativeDecimals = (
        await this.crowdsale.preIcoTokenRateNegativeDecimals()).toNumber();
      assertEqual(actualPreIcoTokenRateNegativeDecimals, newNegativeDecimals);

      const actualLastDayChangePreIcoTokenRate = (
        await this.crowdsale.lastDayChangePreIcoTokenRate()).toNumber();
      assertEqual(actualLastDayChangePreIcoTokenRate, getDays());
    };
    before(async () => {
      const { startTimePreIco } = getDefaultPreIcoDates();
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        founders,
        bountyProgram,
        startTimePreIco,
      );
    });
    describe('wrong parameters:', () => {
      const tokenRateWasntChanged = async (newTokenRate, newNegativeDecimals, newLastDay) => {
        const actualPreIcoTokenRate = (await this.crowdsale.preIcoTokenRate()).toNumber();
        assertEqual(actualPreIcoTokenRate, newTokenRate || this.preIcoTokenRate);

        const actualPreIcoTokenRateNegativeDecimals = (
          await this.crowdsale.preIcoTokenRateNegativeDecimals()).toNumber();
        assertEqual(
          actualPreIcoTokenRateNegativeDecimals,
          newNegativeDecimals || this.preIcoTokenRateNegativeDecimals,
        );

        const actualLastDayChangePreIcoTokenRate = (
          await this.crowdsale.lastDayChangePreIcoTokenRate()).toNumber();
        assertEqual(
          actualLastDayChangePreIcoTokenRate,
          newLastDay || this.lastDayChangePreIcoTokenRate,
        );
      };
      before(async () => {
        this.lastDayChangePreIcoTokenRate = (
          await this.crowdsale.lastDayChangePreIcoTokenRate()).toNumber();
        this.preIcoTokenRate = (await this.crowdsale.preIcoTokenRate()).toNumber();
        this.preIcoTokenRateNegativeDecimals = (
          await this.crowdsale.preIcoTokenRateNegativeDecimals()).toNumber();
      });
      it('not owner or administrator', async () => {
        const changePreIcoTokenRate =
          this.crowdsale.changePreIcoTokenRate(
            newTokenRate1,
            newNegativeDecimals1,
            { from: client2 },
          );
        await changePreIcoTokenRate.should.be.rejectedWith(EVMThrow);
        await tokenRateWasntChanged();
      });
      it('two changes token rate pre-ICO in one day', async () => {
        await this.crowdsale.changePreIcoTokenRate(
          newTokenRate1,
          newNegativeDecimals1,
          { from: owner },
        );
        await positiveResult(newTokenRate1, newNegativeDecimals1);
        const newLastDay = (await this.crowdsale.lastDayChangePreIcoTokenRate()).toNumber();

        const changePreIcoTokenRate =
          this.crowdsale.changePreIcoTokenRate(
            newTokenRate2,
            newNegativeDecimals2,
            { from: owner },
          );
        await changePreIcoTokenRate.should.be.rejectedWith(EVMThrow);
        await tokenRateWasntChanged(newTokenRate1, newNegativeDecimals1, newLastDay);
      });
    });
    describe('right parameters:', () => {
      before(async () => {
        await this.crowdsale.addAdministrator(client1, { from: owner });
      });
      it('changed token rate & negative decimals & last day of change rate in the next day after last change', async () => {
        await timeController.addSeconds(oneDayInSeconds);
        await this.crowdsale.changePreIcoTokenRate(
          newTokenRate2,
          newNegativeDecimals2,
          { from: client1 },
        );
        await positiveResult(newTokenRate2, newNegativeDecimals2);
      });
    });
  });

  describe('#changeIcoTokenRate()', function () {
    const newTokenRate1 = 1234;
    const newNegativeDecimals1 = 5;
    const newTokenRate2 = 4321;
    const newNegativeDecimals2 = 2;
    const positiveResult = async (newTokenRate, newNegativeDecimals) => {
      const actualIcoTokenRate = (await this.crowdsale.icoTokenRate()).toNumber();
      assertEqual(actualIcoTokenRate, newTokenRate);

      const actualIcoTokenRateNegativeDecimals = (
        await this.crowdsale.icoTokenRateNegativeDecimals()).toNumber();
      assertEqual(actualIcoTokenRateNegativeDecimals, newNegativeDecimals);

      const actualLastDayChangeIcoTokenRate = (
        await this.crowdsale.lastDayChangeIcoTokenRate()).toNumber();
      assertEqual(actualLastDayChangeIcoTokenRate, getDays());
    };
    before(async () => {
      const { startTimePreIco } = getDefaultPreIcoDates();
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        founders,
        bountyProgram,
        startTimePreIco,
      );
    });
    describe('wrong parameters:', () => {
      const tokenRateWasntChanged = async (newTokenRate, newNegativeDecimals, newLastDay) => {
        const actualIcoTokenRate = (await this.crowdsale.icoTokenRate()).toNumber();
        assertEqual(actualIcoTokenRate, newTokenRate || this.icoTokenRate);

        const actualIcoTokenRateNegativeDecimals = (
          await this.crowdsale.icoTokenRateNegativeDecimals()).toNumber();
        assertEqual(
          actualIcoTokenRateNegativeDecimals,
          newNegativeDecimals || this.icoTokenRateNegativeDecimals,
        );

        const actualLastDayChangeIcoTokenRate = (
          await this.crowdsale.lastDayChangeIcoTokenRate()).toNumber();
        assertEqual(actualLastDayChangeIcoTokenRate, newLastDay || this.lastDayChangeIcoTokenRate);
      };
      before(async () => {
        this.lastDayChangeIcoTokenRate = (
          await this.crowdsale.lastDayChangeIcoTokenRate()).toNumber();
        this.icoTokenRate = (await this.crowdsale.icoTokenRate()).toNumber();
        this.icoTokenRateNegativeDecimals = (
          await this.crowdsale.icoTokenRateNegativeDecimals()).toNumber();
      });
      it('not owner or administrator', async () => {
        const changeIcoTokenRate =
          this.crowdsale.changeIcoTokenRate(newTokenRate1, newNegativeDecimals1, { from: client2 });
        await changeIcoTokenRate.should.be.rejectedWith(EVMThrow);
        await tokenRateWasntChanged();
      });
      it('two changes token rate ICO in one day', async () => {
        await this.crowdsale.changeIcoTokenRate(
          newTokenRate1,
          newNegativeDecimals1,
          { from: owner },
        );
        await positiveResult(newTokenRate1, newNegativeDecimals1);
        const newLastDay = (await this.crowdsale.lastDayChangeIcoTokenRate()).toNumber();

        const changeIcoTokenRate =
          this.crowdsale.changeIcoTokenRate(newTokenRate2, newNegativeDecimals2, { from: owner });
        await changeIcoTokenRate.should.be.rejectedWith(EVMThrow);
        await tokenRateWasntChanged(newTokenRate1, newNegativeDecimals1, newLastDay);
      });
    });
    describe('right parameters:', () => {
      before(async () => {
        await this.crowdsale.addAdministrator(client1, { from: owner });
      });
      it('changed token rate & negative decimals & last day of change rate in the next day after last change', async () => {
        await timeController.addSeconds(oneDayInSeconds);
        await this.crowdsale.changeIcoTokenRate(
          newTokenRate2,
          newNegativeDecimals2,
          { from: client1 },
        );
        await positiveResult(newTokenRate2, newNegativeDecimals2);
      });
    });
  });

  describe('#sellTokensPreIco()', function () {
    const getPercent = (value, percent) => value.mul(percent).div(100);
    const defaultBefore = async () => {
      const { startTimePreIco, endTimePreIco } = getDefaultPreIcoDates();
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        founders,
        bountyProgram,
        startTimePreIco,
      );
      this.token = MocrowCoin.at(await this.crowdsale.token());
      this.whitelist = Whitelist.at(await this.crowdsale.whitelist());
      await this.crowdsale.addWalletToWhitelist(client1, { from: owner });
      await this.crowdsale.addWalletToWhitelist(client2, { from: owner });
      await this.crowdsale.addAdministrator(client3, { from: owner });

      this.startTimePreIco = startTimePreIco;
      this.endTimePreIco = endTimePreIco;

      this.tokensRemainingPreIcoBefore = await this.crowdsale.tokensRemainingPreIco();
      this.tokensRemainingIcoBefore = await this.crowdsale.tokensRemainingIco();
      this.withdrawal1BalanceBefore = ethBalance(withdrawal1);
      this.withdrawal2BalanceBefore = ethBalance(withdrawal2);
      this.withdrawal3BalanceBefore = ethBalance(withdrawal3);
      this.withdrawal4BalanceBefore = ethBalance(withdrawal4);
      this.client1BalanceBefore = ethBalance(client1);
      this.client2BalanceBefore = ethBalance(client2);
      this.client1TokensBefore = await this.token.balanceOf(client1);
      this.client2TokensBefore = await this.token.balanceOf(client2);
      this.client1InvestentAmountBefore = await this.crowdsale.investmentsPreIco(client1);
      this.client2InvestentAmountBefore = await this.crowdsale.investmentsPreIco(client2);

      this.client1AmountOfPurchase = purchaseOneEth.add(purchaseOneEth);
    };
    describe('wrong parameters:', () => {
      const nothingWasChanged = () => {
        it('tokensRemainingPreIco wasn\'t changed', async () => {
          const newTokensRemainingPreIcoAfter = (
            await this.crowdsale.tokensRemainingPreIco()).toNumber();
          assertEqual(newTokensRemainingPreIcoAfter, this.tokensRemainingPreIcoBefore.toNumber());
        });
        it('tokensRemainingIco wasn\'t changed', async () => {
          const newTokensRemainingIcoAfter = (await this.crowdsale.tokensRemainingIco()).toNumber();
          assertEqual(newTokensRemainingIcoAfter, this.tokensRemainingIcoBefore.toNumber());
        });
        it('withdrawal1 balance wasn\'t changed', async () => {
          const newWithdrawal1BalanceAfter = ethBalance(withdrawal1).toNumber();
          assertEqual(newWithdrawal1BalanceAfter, this.withdrawal1BalanceBefore.toNumber());
        });
        it('withdrawal2 balance wasn\'t changed', async () => {
          const newWithdrawal2BalanceAfter = ethBalance(withdrawal2).toNumber();
          assertEqual(newWithdrawal2BalanceAfter, this.withdrawal2BalanceBefore.toNumber());
        });
        it('withdrawal3 balance wasn\'t changed', async () => {
          const newWithdrawal3BalanceAfter = ethBalance(withdrawal3).toNumber();
          assertEqual(newWithdrawal3BalanceAfter, this.withdrawal3BalanceBefore.toNumber());
        });
        it('withdrawal4 balance wasn\'t changed', async () => {
          const newWithdrawal4BalanceAfter = ethBalance(withdrawal4).toNumber();
          assertEqual(newWithdrawal4BalanceAfter, this.withdrawal4BalanceBefore.toNumber());
        });

        it('tokens of client1 wasn\'t changed', async () => {
          const newClient1TokensAfter = (await this.token.balanceOf(client1)).toNumber();
          assertEqual(newClient1TokensAfter, this.client1TokensBefore.toNumber());
        });
        it('tokens of client2 wasn\'t changed', async () => {
          const newClient2TokensAfter = (await this.token.balanceOf(client2)).toNumber();
          assertEqual(newClient2TokensAfter, this.client2TokensBefore.toNumber());
        });
        it('investments of client1 wasn\'t changed', async () => {
          const newClient1InvestentAmountAfter = (
            await this.crowdsale.investmentsPreIco(client1)).toNumber();
          assertEqual(newClient1InvestentAmountAfter, this.client1InvestentAmountBefore.toNumber());
        });
        it('investments of client2 wasn\'t changed', async () => {
          const newClient2InvestentAmountAfter = (
            await this.crowdsale.investmentsPreIco(client2)).toNumber();
          assertEqual(newClient2InvestentAmountAfter, this.client2InvestentAmountBefore.toNumber());
        });
      };
      describe('not in pre-ICO sale period:', () => {
        before(defaultBefore);
        describe('before', () => {
          before(async () => {
            const sellTokensPreIco = this.crowdsale.sellTokensPreIco({
              from: client1,
              value: purchaseOneEth.add(this.client1AmountOfPurchase),
            });
            await sellTokensPreIco.should.be.rejectedWith(EVMThrow);
          });
          nothingWasChanged();
        });
        describe('after', () => {
          before(async () => {
            await timeController.addSeconds(preIcoEnd);
            const sellTokensPreIco =
              this.crowdsale.sellTokensPreIco({ from: client2, value: purchaseOneEth });
            await sellTokensPreIco.should.be.rejectedWith(EVMThrow);
          });
          nothingWasChanged();
        });
      });
      describe('not whitelisted client:', () => {
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(preIcoStartShift);
          const sellTokensPreIco = this.crowdsale.sellTokensPreIco({
            from: client3,
            value: purchaseOneEth.add(this.client1AmountOfPurchase),
          });
          await sellTokensPreIco.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('when paused:', () => {
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(preIcoStartShift);
          await this.crowdsale.pause({ from: client3 });

          const sellTokensPreIco = this.crowdsale.sellTokensPreIco({
            from: client1,
            value: purchaseOneEth.add(this.client1AmountOfPurchase),
          });
          await sellTokensPreIco.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('less than minimal investment:', () => {
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(preIcoStartShift);
          const sellTokensPreIco = this.crowdsale.sellTokensPreIco({
            from: client1,
            value: minimalInvestment.sub(1),
          });
          await sellTokensPreIco.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
    });
    describe('right parameters:', () => {
      describe('common requests:', () => {
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(preIcoStartShift);
          this.preIcoTokenRate = await this.crowdsale.preIcoTokenRate();
          this.preIcoTokenRateNegativeDecimals =
            await this.crowdsale.preIcoTokenRateNegativeDecimals();
          await this.crowdsale.sellTokensPreIco({
            from: client1,
            value: purchaseOneEth,
          });
          await this.crowdsale.sellTokensPreIco({
            from: client1,
            value: purchaseOneEth,
          });
          await this.crowdsale.sellTokensPreIco({
            from: client2,
            value: purchaseHalfEth,
          });
        });
        it('client 1 balance decreased after purchase', async () => {
          const client1BalanceAfter = ethBalance(client1).toNumber();
          assertTrue(client1BalanceAfter <=
            this.client1BalanceBefore.sub(this.client1AmountOfPurchase).toNumber());
        });

        it('client 2 balance decreased after purchase', async () => {
          const client2BalanceAfter = ethBalance(client2).toNumber();
          assertTrue(client2BalanceAfter <=
            this.client2BalanceBefore.sub(purchaseHalfEth).toNumber());
        });

        it('withdrawal wallet 1 balance after purchase', async () => {
          const withdrawal1BalanceAfter = ethBalance(withdrawal1).toNumber();
          this.client1Withdrawal1Value =
            getPercent(this.client1AmountOfPurchase, withdrawal1Percent);
          this.client2Withdrawal1Value = getPercent(purchaseHalfEth, withdrawal1Percent);
          assertEqual(
            withdrawal1BalanceAfter,
            this.withdrawal1BalanceBefore
              .add(this.client1Withdrawal1Value)
              .add(this.client2Withdrawal1Value)
              .toNumber(),
          );
        });

        it('withdrawal wallet 2 balance after purchase', async () => {
          const withdrawal2BalanceAfter = ethBalance(withdrawal2).toNumber();
          this.client1Withdrawal2Value =
            getPercent(this.client1AmountOfPurchase, withdrawal2Percent);
          this.client2Withdrawal2Value = getPercent(purchaseHalfEth, withdrawal2Percent);
          assertEqual(
            withdrawal2BalanceAfter,
            this.withdrawal2BalanceBefore
              .add(this.client1Withdrawal2Value)
              .add(this.client2Withdrawal2Value)
              .toNumber(),
          );
        });
        it('withdrawal wallet 3 balance after purchase', async () => {
          const withdrawal3BalanceAfter = ethBalance(withdrawal3).toNumber();
          this.client1Withdrawal3Value =
            getPercent(this.client1AmountOfPurchase, withdrawal3Percent);
          this.client2Withdrawal3Value = getPercent(purchaseHalfEth, withdrawal3Percent);
          assertEqual(
            withdrawal3BalanceAfter,
            this.withdrawal3BalanceBefore
              .add(this.client1Withdrawal3Value)
              .add(this.client2Withdrawal3Value)
              .toNumber(),
          );
        });
        it('withdrawal wallet 4 balance after purchase', async () => {
          const withdrawal4BalanceAfter = ethBalance(withdrawal4).toNumber();
          this.client1Withdrawal4Value = this.client1AmountOfPurchase
            .sub(this.client1Withdrawal1Value)
            .sub(this.client1Withdrawal2Value)
            .sub(this.client1Withdrawal3Value);
          this.client2Withdrawal4Value = purchaseHalfEth
            .sub(this.client2Withdrawal1Value)
            .sub(this.client2Withdrawal2Value)
            .sub(this.client2Withdrawal3Value);
          assertEqual(
            withdrawal4BalanceAfter,
            this.withdrawal4BalanceBefore
              .add(this.client1Withdrawal4Value)
              .add(this.client2Withdrawal4Value)
              .toNumber(),
          );
        });
        it('pre-ICO tokens remaining after purchase', async () => {
          const tokensRemainingPreIcoAfter = (
            await this.crowdsale.tokensRemainingPreIco()).toNumber();
          assertEqual(
            tokensRemainingPreIcoAfter,
            this.tokensRemainingPreIcoBefore
              .sub(this.client1AmountOfPurchase
                .add(purchaseHalfEth)
                .div(tokenRatePreIco))
              .toNumber(),
          );
        });
        it('ICO tokens remaining after purchase', async () => {
          const tokensRemainingIcoAfter = (await this.crowdsale.tokensRemainingIco()).toNumber();
          assertEqual(
            tokensRemainingIcoAfter,
            this.tokensRemainingIcoBefore
              .sub(this.client1AmountOfPurchase
                .add(purchaseHalfEth)
                .div(tokenRatePreIco))
              .toNumber(),
          );
        });

        it('tokens amount of client 1 after purchase', async () => {
          const newClient1TokensAfter = await this.token.balanceOf(client1);
          assertEqualBigNumbers(
            newClient1TokensAfter,
            this.client1TokensBefore
              .add(this.client1AmountOfPurchase
                .div(this.preIcoTokenRate)
                .mul(10 ** this.preIcoTokenRateNegativeDecimals)),
          );
        });
        it('tokens amount of client 2 after purchase', async () => {
          const newClient2TokensAfter = await this.token.balanceOf(client2);
          assertEqualBigNumbers(
            newClient2TokensAfter,
            this.client1TokensBefore
              .add(purchaseHalfEth
                .div(this.preIcoTokenRate)
                .mul(10 ** this.preIcoTokenRateNegativeDecimals)),
          );
        });

        it('investor(client) 1 purchase value', async () => {
          const investment1Value = (await this.crowdsale.investmentsPreIco(client1)).toNumber();
          assertEqual(investment1Value, this.client1AmountOfPurchase.toNumber());
        });
        it('investor(client) 2 purchase value', async () => {
          const investment2Value = (await this.crowdsale.investmentsPreIco(client2)).toNumber();
          assertEqual(investment2Value, purchaseHalfEth.toNumber());
        });
      });
    });
  });

  describe('#sellTokensIco()', function () {
    const getPercent = (value, percent) => value.mul(percent / 100);
    const defaultBefore = async () => {
      const { startTimePreIco } = getDefaultPreIcoDates();
      const { startTimeIco, endTimeIco } = getDefaultIcoDates();
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        founders,
        bountyProgram,
        startTimePreIco,
      );
      this.token = MocrowCoin.at(await this.crowdsale.token());
      this.whitelist = Whitelist.at(await this.crowdsale.whitelist());
      await this.crowdsale.addWalletToWhitelist(client1, { from: owner });
      await this.crowdsale.addWalletToWhitelist(client2, { from: owner });

      this.startTimeIco = startTimeIco;
      this.endTimeIco = endTimeIco;

      this.tokensRemainingIcoBefore = await this.crowdsale.tokensRemainingIco();
      this.compaignAllocationAndBonusRemainingTokens =
        await this.crowdsale.compaignAllocationAndBonusRemainingTokens();
      this.withdrawal1BalanceBefore = ethBalance(withdrawal1);
      this.withdrawal2BalanceBefore = ethBalance(withdrawal2);
      this.withdrawal3BalanceBefore = ethBalance(withdrawal3);
      this.withdrawal4BalanceBefore = ethBalance(withdrawal4);
      this.client1BalanceBefore = ethBalance(client1);
      this.client2BalanceBefore = ethBalance(client2);
      this.client1TokensBefore = await this.token.balanceOf(client1);
      this.client2TokensBefore = await this.token.balanceOf(client2);
      this.client1InvestentAmountBefore = await this.crowdsale.investmentsIco(client1);
      this.client2InvestentAmountBefore = await this.crowdsale.investmentsIco(client2);
    };
    describe('wrong parameters:', () => {
      const nothingWasChanged = () => {
        it('tokensRemainingIco wasn\'t changed', async () => {
          const newTokensRemainingIcoAfter = (await this.crowdsale.tokensRemainingIco()).toNumber();
          assertEqual(newTokensRemainingIcoAfter, this.tokensRemainingIcoBefore.toNumber());
        });
        it('compaignAllocationAndBonusRemainingTokens wasn\'t changed', async () => {
          const newCompaignAllocationAndBonusRemainingTokensAfter = (
            await this.crowdsale.compaignAllocationAndBonusRemainingTokens()).toNumber();
          assertEqual(
            newCompaignAllocationAndBonusRemainingTokensAfter,
            this.compaignAllocationAndBonusRemainingTokens.toNumber(),
          );
        });
        it('withdrawal1 balance wasn\'t changed', async () => {
          const newWithdrawal1BalanceAfter = ethBalance(withdrawal1).toNumber();
          assertEqual(newWithdrawal1BalanceAfter, this.withdrawal1BalanceBefore.toNumber());
        });
        it('withdrawal2 balance wasn\'t changed', async () => {
          const newWithdrawal2BalanceAfter = ethBalance(withdrawal2).toNumber();
          assertEqual(newWithdrawal2BalanceAfter, this.withdrawal2BalanceBefore.toNumber());
        });
        it('withdrawal3 balance wasn\'t changed', async () => {
          const newWithdrawal3BalanceAfter = ethBalance(withdrawal3).toNumber();
          assertEqual(newWithdrawal3BalanceAfter, this.withdrawal3BalanceBefore.toNumber());
        });
        it('withdrawal4 balance wasn\'t changed', async () => {
          const newWithdrawal4BalanceAfter = ethBalance(withdrawal4).toNumber();
          assertEqual(newWithdrawal4BalanceAfter, this.withdrawal4BalanceBefore.toNumber());
        });

        it('tokens of client1 wasn\'t changed', async () => {
          const newClient1TokensAfter = (await this.token.balanceOf(client1)).toNumber();
          assertEqual(newClient1TokensAfter, this.client1TokensBefore.toNumber());
        });
        it('tokens of client2 wasn\'t changed', async () => {
          const newClient2TokensAfter = (await this.token.balanceOf(client2)).toNumber();
          assertEqual(newClient2TokensAfter, this.client2TokensBefore.toNumber());
        });
        it('investments of client1 wasn\'t changed', async () => {
          const newClient1InvestentAmountAfter = (
            await this.crowdsale.investmentsIco(client1)).toNumber();
          assertEqual(newClient1InvestentAmountAfter, this.client1InvestentAmountBefore.toNumber());
        });
        it('investments of client2 wasn\'t changed', async () => {
          const newClient2InvestentAmountAfter = (
            await this.crowdsale.investmentsIco(client2)).toNumber();
          assertEqual(newClient2InvestentAmountAfter, this.client2InvestentAmountBefore.toNumber());
        });
      };
      describe('not in ICO sale period:', () => {
        before(defaultBefore);
        describe('before', () => {
          before(async () => {
            const sellTokensIco = this.crowdsale.sellTokensIco({
              from: client1,
              value: purchaseOneEth,
            });
            await sellTokensIco.should.be.rejectedWith(EVMThrow);
          });
          nothingWasChanged();
        });
        describe('after', () => {
          before(async () => {
            await timeController.addSeconds(icoEnd);
            const sellTokensIco =
              this.crowdsale.sellTokensIco({ from: client2, value: purchaseOneEth });
            await sellTokensIco.should.be.rejectedWith(EVMThrow);
          });
          nothingWasChanged();
        });
      });
      describe('not whitelisted client:', () => {
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(preIcoStartShift);
          const sellTokensIco = this.crowdsale.sellTokensIco({
            from: client3,
            value: purchaseOneEth,
          });
          await sellTokensIco.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('when paused:', () => {
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(preIcoStartShift);
          await this.crowdsale.pause({ from: owner });

          const sellTokensIco = this.crowdsale.sellTokensIco({
            from: client1,
            value: purchaseOneEth,
          });
          await sellTokensIco.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('less than minimal investment:', () => {
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(preIcoStartShift);
          const sellTokensIco = this.crowdsale.sellTokensIco({
            from: client1,
            value: minimalInvestment.sub(1),
          });
          await sellTokensIco.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
    });
    describe('right parameters:', () => {
      describe('common requests:', () => {
        // client1 - time bonus 10, time bonus 5 + value bonus 10 (maxInvest + one ether)
        // client2 - value bonus 5, without bonuses
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(icoStartShift);
          this.compaignAllocationAndBonusRemainingTokens =
            await this.crowdsale.compaignAllocationAndBonusRemainingTokens();
          await this.crowdsale.sellTokensIco({
            from: client1,
            value: purchaseOneEth,
          });
          await timeController.addSeconds(tenPercentBonusDuration);
          await this.crowdsale.sellTokensIco({
            from: client1,
            value: maximalInvestment.add(purchaseOneEth),
          });
          await timeController.addSeconds(fivePercentBonusDuration);
          await this.crowdsale.sellTokensIco({
            from: client2,
            value: minimalFivePercentBonusByValue,
          });
          await this.crowdsale.sellTokensIco({
            from: client2,
            value: purchaseHalfEth,
          });
          // this.client1AmountOfPurchase = purchaseOneEth.add(maximalInvestment);
          this.client1AmountOfPurchase = maximalInvestment;
          this.client2AmountOfPurchase = minimalFivePercentBonusByValue.add(purchaseHalfEth);
          const client1FirstPurchaseBonuses = purchaseOneEth.div(tokenRateIco).mul(bonus2);
          const bonusSum = (bonus1 + bonus2).toFixed(2);
          const client1SecondPurchaseBonuses =
            (maximalInvestment.sub(purchaseOneEth)).div(tokenRateIco).mul(parseFloat(bonusSum));
          this.client1BonusTokens = client1FirstPurchaseBonuses.add(client1SecondPurchaseBonuses);
          this.client2BonusTokens = minimalFivePercentBonusByValue.div(tokenRateIco).mul(bonus1);
        });
        it('client 1 balance decreased after purchase', async () => {
          const client1BalanceAfter = ethBalance(client1).toNumber();
          assertTrue(client1BalanceAfter <=
            this.client1BalanceBefore.sub(this.client1AmountOfPurchase).toNumber());
        });

        it('client 2 balance decreased after purchase', async () => {
          const client2BalanceAfter = ethBalance(client2).toNumber();
          assertTrue(client2BalanceAfter <=
            this.client2BalanceBefore.sub(this.client2AmountOfPurchase).toNumber());
        });

        it('withdrawal wallet 1 balance after purchase', async () => {
          const withdrawal1BalanceAfter = ethBalance(withdrawal1).toNumber();
          this.client1Withdrawal1Value =
            getPercent(this.client1AmountOfPurchase, withdrawal1Percent);
          this.client2Withdrawal1Value =
            getPercent(this.client2AmountOfPurchase, withdrawal1Percent);
          assertEqual(
            withdrawal1BalanceAfter,
            this.withdrawal1BalanceBefore
              .add(this.client1Withdrawal1Value)
              .add(this.client2Withdrawal1Value)
              .toNumber(),
          );
        });

        it('withdrawal wallet 2 balance after purchase', async () => {
          const withdrawal2BalanceAfter = ethBalance(withdrawal2).toNumber();
          this.client1Withdrawal2Value =
            getPercent(this.client1AmountOfPurchase, withdrawal2Percent);
          this.client2Withdrawal2Value =
            getPercent(this.client2AmountOfPurchase, withdrawal2Percent);
          assertEqual(
            withdrawal2BalanceAfter,
            this.withdrawal2BalanceBefore
              .add(this.client1Withdrawal2Value)
              .add(this.client2Withdrawal2Value)
              .toNumber(),
          );
        });
        it('withdrawal wallet 3 balance after purchase', async () => {
          const withdrawal3BalanceAfter = ethBalance(withdrawal3).toNumber();
          this.client1Withdrawal3Value =
            getPercent(this.client1AmountOfPurchase, withdrawal3Percent);
          this.client2Withdrawal3Value =
            getPercent(this.client2AmountOfPurchase, withdrawal3Percent);
          assertEqual(
            withdrawal3BalanceAfter,
            this.withdrawal3BalanceBefore
              .add(this.client1Withdrawal3Value)
              .add(this.client2Withdrawal3Value)
              .toNumber(),
          );
        });
        it('withdrawal wallet 4 balance after purchase', async () => {
          const withdrawal4BalanceAfter = ethBalance(withdrawal4).toNumber();
          this.client1Withdrawal4Value = this.client1AmountOfPurchase
            .sub(this.client1Withdrawal1Value)
            .sub(this.client1Withdrawal2Value)
            .sub(this.client1Withdrawal3Value);
          this.client2Withdrawal4Value = this.client2AmountOfPurchase
            .sub(this.client2Withdrawal1Value)
            .sub(this.client2Withdrawal2Value)
            .sub(this.client2Withdrawal3Value);
          assertEqual(
            withdrawal4BalanceAfter,
            this.withdrawal4BalanceBefore
              .add(this.client1Withdrawal4Value)
              .add(this.client2Withdrawal4Value)
              .toNumber(),
          );
        });
        it('ICO tokens remaining after purchase', async () => {
          const tokensRemainingIcoAfter = (await this.crowdsale.tokensRemainingIco()).toNumber();
          const tokensToClients =
            this.client1AmountOfPurchase.add(this.client2AmountOfPurchase).div(tokenRateIco);
          assertEqual(
            tokensRemainingIcoAfter,
            this.tokensRemainingIcoBefore.sub(tokensToClients).toNumber(),
          );
        });

        it('compaign allocation and bonus remaining tokens after purchase', async () => {
          const compaignAllocationAndBonusRemainingTokens = (
            await this.crowdsale.compaignAllocationAndBonusRemainingTokens()).toNumber();
          assertEqual(
            compaignAllocationAndBonusRemainingTokens,
            this.compaignAllocationAndBonusRemainingTokens
              .sub(this.client1BonusTokens)
              .sub(this.client2BonusTokens)
              .toNumber(),
          );
        });

        it('tokens amount of client 1 after purchase', async () => {
          const newClient1TokensAfter = await this.token.balanceOf(client1);
          const client1Tokens = this.client1AmountOfPurchase.div(tokenRateIco);
          assertEqualBigNumbers(
            newClient1TokensAfter,
            this.client1TokensBefore.add(client1Tokens).add(this.client1BonusTokens),
          );
        });
        it('tokens amount of client 2 after purchase', async () => {
          const newClient2TokensAfter = await this.token.balanceOf(client2);
          const client2Tokens = this.client2AmountOfPurchase.div(tokenRateIco);
          assertEqualBigNumbers(
            newClient2TokensAfter,
            this.client1TokensBefore.add(client2Tokens).add(this.client2BonusTokens),
          );
        });

        it('investor(client) 1 purchase value', async () => {
          const investment1Value = (await this.crowdsale.investmentsIco(client1)).toNumber();
          assertEqual(investment1Value, this.client1AmountOfPurchase.toNumber());
        });
        it('investor(client) 2 purchase value', async () => {
          const investment2Value = (await this.crowdsale.investmentsIco(client2)).toNumber();
          assertEqual(investment2Value, this.client2AmountOfPurchase.toNumber());
        });
      });
    });
  });

  describe('#transferRemainingCompaignAllocationAndBonusTokens()', function () {
    const defaultBefore = async () => {
      const { startTimePreIco } = getDefaultPreIcoDates();
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        client1,
        client2,
        startTimePreIco,
      );
      this.token = MocrowCoin.at(await this.crowdsale.token());
      this.whitelist = Whitelist.at(await this.crowdsale.whitelist());

      this.endTimeIco = await this.crowdsale.endTimeIco();
    };
    describe('wrong parameters:', () => {
      before(defaultBefore);
      const nothingWasChanged = () => {
        it('campaign allocation tokens amount wasn\'t changed', async () => {
          const newCampaignAllocationBalance = (await this.token.balanceOf(client1)).toNumber();
          assertEqual(newCampaignAllocationBalance, this.balanceAfterTransfer || 0);
        });
        it('compaignAllocationAndBonusRemainingTokens wasn\'t changed', async () => {
          const newCompaignAllocationAndBonusRemainingTokens = (
            await this.crowdsale.compaignAllocationAndBonusRemainingTokens()).toNumber();
          assertEqual(
            newCompaignAllocationAndBonusRemainingTokens,
            this.remainingTokensAfterTransfer === undefined ?
              compaignAllocationAndBonusesTokens.toNumber() :
              this.remainingTokensAfterTransfer,
          );
        });
      };
      describe('not after ICO sale period:', () => {
        before(async () => {
          const transferTokens =
            this.crowdsale.transferRemainingCompaignAllocationAndBonusTokens({ from: owner });
          await transferTokens.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('not owner or administrator:', () => {
        before(async () => {
          await timeController.addSeconds(icoEnd);
          const transferTokens =
            this.crowdsale.transferRemainingCompaignAllocationAndBonusTokens({ from: client3 });
          await transferTokens.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('two times(first is common request with right parameters):', () => {
        before(async () => {
          await this.crowdsale.transferRemainingCompaignAllocationAndBonusTokens({ from: owner });
          this.balanceAfterTransfer = (await this.token.balanceOf(client1)).toNumber();
          this.remainingTokensAfterTransfer = (
            await this.crowdsale.compaignAllocationAndBonusRemainingTokens()).toNumber();
          const transferTokens =
            this.crowdsale.transferRemainingCompaignAllocationAndBonusTokens({ from: owner });
          await transferTokens.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
    });
  });

  describe('#transferUnsoldTokens()', function () {
    const defaultBefore = async () => {
      const { startTimePreIco } = getDefaultPreIcoDates();
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        client1,
        client2,
        startTimePreIco,
      );
      this.token = MocrowCoin.at(await this.crowdsale.token());
      this.whitelist = Whitelist.at(await this.crowdsale.whitelist());

      this.endTimeIco = await this.crowdsale.endTimeIco();
    };
    describe('wrong parameters:', () => {
      before(defaultBefore);
      const nothingWasChanged = () => {
        it('remaining ICO tokens amount wasn\'t changed', async () => {
          const newUnsoldTokensBalance = (await this.token.balanceOf(client1)).toNumber();
          assertEqual(newUnsoldTokensBalance, this.balanceAfterTransfer || 0);
        });
        it('tokensRemainingIco wasn\'t changed', async () => {
          const newTokensRemainingIco = (await this.crowdsale.tokensRemainingIco()).toNumber();
          assertEqual(
            newTokensRemainingIco,
            this.remainingTokensAfterTransfer ===
              undefined ? tokensRemainingIco.toNumber() : this.remainingTokensAfterTransfer,
          );
        });
      };
      describe('not after ICO sale period:', () => {
        before(async () => {
          const transferUnsoldTokens = this.crowdsale.transferUnsoldTokens({ from: owner });
          await transferUnsoldTokens.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('not owner or administrator:', () => {
        before(async () => {
          await timeController.addSeconds(icoEnd);
          const transferUnsoldTokens = this.crowdsale.transferUnsoldTokens({ from: client3 });
          await transferUnsoldTokens.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('two times(first is common request with right parameters):', () => {
        before(async () => {
          await this.crowdsale.transferUnsoldTokens({ from: owner });
          this.balanceAfterTransfer = (await this.token.balanceOf(client1)).toNumber();
          this.remainingTokensAfterTransfer = (
            await this.crowdsale.tokensRemainingIco()).toNumber();
          const transferTokens = this.crowdsale.transferUnsoldTokens({ from: owner });
          await transferTokens.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
    });
  });

  describe('#transferOwnershipForTokenAndWhitelist()', function () {
    const defaultBefore = async () => {
      const { startTimePreIco } = getDefaultPreIcoDates();
      this.crowdsale = await MocrowCoinCrowdsale.new(
        withdrawal1,
        withdrawal2,
        withdrawal3,
        withdrawal4,
        client3,
        founders,
        bountyProgram,
        client1,
        client2,
        startTimePreIco,
      );
      this.token = MocrowCoin.at(await this.crowdsale.token());
      this.whitelist = Whitelist.at(await this.crowdsale.whitelist());

      this.endTimeIco = await this.crowdsale.endTimeIco();
    };
    describe('wrong parameters:', () => {
      before(defaultBefore);
      const nothingWasChanged = () => {
        it('token owner wasn\'t changed', async () => {
          const newTokenOwner = await this.token.owner();
          assertEqual(newTokenOwner, this.crowdsale.address);
        });
        it('whitelist owner wasn\'t changed', async () => {
          const newWhitelistOwner = await this.whitelist.owner();
          assertEqual(newWhitelistOwner, this.crowdsale.address);
        });
      };
      describe('not after ICO sale period:', () => {
        before(async () => {
          const transferOwnership =
              this.crowdsale.transferOwnershipForTokenAndWhitelist({ from: owner });
          await transferOwnership.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
      describe('not owner or administrator:', () => {
        before(async () => {
          await timeController.addSeconds(icoEnd);
          const transferOwnership =
              this.crowdsale.transferOwnershipForTokenAndWhitelist({ from: owner });
          await transferOwnership.should.be.rejectedWith(EVMThrow);
        });
        nothingWasChanged();
      });
    });
    describe('right parameter:', () => {
      describe('request with change owners:', () => {
        before(async () => {
          await defaultBefore();
          await timeController.addSeconds(icoEnd);
          await this.crowdsale.transferUnsoldTokens({ from: owner });
          await this.crowdsale.transferRemainingCompaignAllocationAndBonusTokens({ from: owner });
          await this.crowdsale.transferOwnershipForTokenAndWhitelist({ from: owner });
        });
        it('token owner was changed', async () => {
          const newTokenOwner = await this.token.owner();
          assertEqual(newTokenOwner, owner);
        });
        it('whitelist owner was changed', async () => {
          const newWhitelistOwner = await this.whitelist.owner();
          assertEqual(newWhitelistOwner, owner);
        });
      });
    });
  });
});
