import { EVMThrow, assertEqual } from './utils';
import {
  reservedTokensForFounders,
  validAmountForFounders,
  totalSupply,
  ownerBalance,
  validAmountForOwner,
  invalidAmountForOwner,
  getDefaultWallets,
} from './constants';

const MocrowCoin = artifacts.require('MocrowCoin');

contract('MocrowCoin', (wallets) => {
  const { owner, founders, bountyProgram, client3 } = getDefaultWallets(wallets);

  beforeEach(async function () {
    this.token = await MocrowCoin.new(founders, bountyProgram, client3);
  });

  describe('Burnable token tests', () => {
    it('should burn tokens for an owner', async function () {
      await this.token.burn(validAmountForOwner, { from: owner });

      const ownerBalanceAfterBurn = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(
        ownerBalanceAfterBurn,
        ownerBalance.sub(validAmountForOwner).toNumber(),
      );

      const totalSupplyAfterBurn = (await this.token.totalSupply()).toNumber();
      assertEqual(
        totalSupplyAfterBurn,
        totalSupply.sub(validAmountForOwner).toNumber(),
      );
    });
    it('should burn tokens for an other account', async function () {
      await this.token.burn(validAmountForFounders, { from: founders });

      const reservedTokensForFoundersAfterBurn = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        reservedTokensForFoundersAfterBurn,
        reservedTokensForFounders.sub(validAmountForFounders).toNumber(),
      );

      const totalSupplyAfterBurn = (await this.token.totalSupply()).toNumber();
      assertEqual(
        totalSupplyAfterBurn,
        totalSupply.sub(validAmountForFounders).toNumber(),
      );
    });
    it('should not burn tokens if sender uses a zero amount of tokens to be burned', async function () {
      const burn = this.token.burn(0, { from: owner });

      await burn.should.be.rejectedWith(EVMThrow);

      const ownerBalanceAfterBurn = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(
        ownerBalanceAfterBurn,
        ownerBalance.toNumber(),
      );

      const totalSupplyAfterBurn = (await this.token.totalSupply()).toNumber();
      assertEqual(
        totalSupplyAfterBurn,
        totalSupply.toNumber(),
      );
    });
    it('should not burn tokens if sender does not has enough tokens to be burned', async function () {
      const burn = this.token.burn(invalidAmountForOwner, { from: owner });

      await burn.should.be.rejectedWith(EVMThrow);

      const ownerBalanceAfterBurn = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(
        ownerBalanceAfterBurn,
        ownerBalance.toNumber(),
      );

      const totalSupplyAfterBurn = (await this.token.totalSupply()).toNumber();
      assertEqual(
        totalSupplyAfterBurn,
        totalSupply.toNumber(),
      );
    });
  });
});
