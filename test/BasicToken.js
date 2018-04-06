import { EVMThrow, assertEqual } from './utils';
import {
  reservedTokensForFounders,
  validAmountForFounders,
  invalidAmountForFounders,
  reservedTokensForBountyProgram,
  totalSupply,
  ownerBalance,
  getDefaultWallets,
} from './utils/constants';

const MocrowCoin = artifacts.require('MocrowCoin');

contract('MocrowCoin', (wallets) => {
  const {
    owner,
    founders,
    bountyProgram,
    client3,
  } = getDefaultWallets(wallets);

  beforeEach(async function () {
    // given
    this.token = await MocrowCoin.new(founders, bountyProgram, client3);

    // await this.token.mint(accountOne, firstAccountAmount, { from: owner });
  });

  describe('Basic token tests', () => {
    it('should increase owner account balance after deploy', async function () {
      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(ownerBalance.toNumber(), actualOwnerBalance);
    });

    it('should increase founders account balance after deploy', async function () {
      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(actualReservedTokensForFounders, reservedTokensForFounders.toNumber());
    });

    it('should increase bounty program account balance after deploy', async function () {
      const actualReservedTokensForBountyProgram = (
        await this.token.balanceOf(bountyProgram)).toNumber();
      assertEqual(actualReservedTokensForBountyProgram, reservedTokensForBountyProgram.toNumber());
    });

    it('should provide correct total supply', async function () {
      const actualTotalSupply = (await this.token.totalSupply()).toNumber();
      assertEqual(actualTotalSupply, totalSupply.toNumber());
    });

    it('should transfer tokens to another account', async function () {
      await this.token.transfer(founders, validAmountForFounders, { from: owner });

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(actualOwnerBalance, ownerBalance.sub(validAmountForFounders).toNumber());

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.add(validAmountForFounders).toNumber(),
      );
    });

    it('should not transfer tokens to 0x0 address', async function () {
      const transfer = this.token.transfer(0x0, validAmountForFounders, { from: owner });

      await transfer.should.be.rejectedWith(EVMThrow);

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(actualReservedTokensForFounders, reservedTokensForFounders.toNumber());
    });

    it('should not transfer tokens if sender does not have enough tokens', async function () {
      const transfer = this.token.transfer(
        owner,
        invalidAmountForFounders,
        { from: founders },
      );

      await transfer.should.be.rejectedWith(EVMThrow);

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(actualOwnerBalance, ownerBalance.toNumber());

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(actualReservedTokensForFounders, reservedTokensForFounders.toNumber());
    });
  });
});
