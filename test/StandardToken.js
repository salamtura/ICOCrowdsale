import { EVMThrow, assertEqual } from './utils';
import {
  reservedTokensForFounders,
  ownerBalance,
  validAmountForOwner,
  invalidAmountForOwner,
  getDefaultWallets,
} from './constants';

const MocrowCoin = artifacts.require('MocrowCoin');

contract('MocrowCoin', (wallets) => {
  const { owner, founders, bountyProgram, client3 } = getDefaultWallets(wallets);
  const allowAmountForOwner = validAmountForOwner.div(2);
  const allowableAmountForOwner = allowAmountForOwner.div(2);

  beforeEach(async function () {
    this.token = await MocrowCoin.new(founders, bountyProgram, client3);

    await this.token.approve(bountyProgram, allowAmountForOwner, { from: owner });
  });

  describe('Standard token tests', () => {
    it('should set allowable amount of tokens for a spender', async function () {
      await this.token.approve(bountyProgram, validAmountForOwner, { from: owner });

      const bountyProgramAllowance = (await this.token.allowance(owner, bountyProgram)).toNumber();
      assertEqual(bountyProgramAllowance, validAmountForOwner.toNumber());
    });

    it('should increase allowed amount of tokens for a spender', async function () {
      await this.token.increaseApproval(bountyProgram, validAmountForOwner, { from: owner });

      const bountyProgramAllowance = (await this.token.allowance(owner, bountyProgram)).toNumber();
      assertEqual(bountyProgramAllowance, allowAmountForOwner.add(validAmountForOwner).toNumber());
    });

    it('should decrease allowed amount of tokens for a spender', async function () {
      await this.token.decreaseApproval(bountyProgram, allowableAmountForOwner, { from: owner });

      const bountyProgramAllowance = (await this.token.allowance(owner, bountyProgram)).toNumber();
      assertEqual(bountyProgramAllowance, allowAmountForOwner.sub(allowableAmountForOwner).toNumber());
    });

    it('should decrease allowed amount of tokens to 0 for a spender if sender uses too much value while decrease', async function () {
      await this.token.decreaseApproval(bountyProgram, validAmountForOwner, { from: owner });

      const bountyProgramAllowance = (await this.token.allowance(owner, bountyProgram)).toNumber();
      assertEqual(bountyProgramAllowance, 0);
    });

    it('should transfer tokens from one account to another', async function () {
      await this.token.transferFrom(
        owner,
        founders,
        allowableAmountForOwner,
        { from: bountyProgram },
      );

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(actualOwnerBalance, ownerBalance.sub(allowableAmountForOwner).toNumber());

      const foundersBalance = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(foundersBalance, reservedTokensForFounders.add(allowableAmountForOwner).toNumber());

      const bountyProgramAllowance = (await this.token.allowance(owner, bountyProgram)).toNumber();
      assertEqual(bountyProgramAllowance, allowAmountForOwner.sub(allowableAmountForOwner).toNumber());
    });

    it('should not transfer tokens from one account to another if token holder does not have enough tokens', async function () {
      const transferFrom = this.token.transferFrom(
        owner,
        founders,
        validAmountForOwner,
        { from: bountyProgram },
      );

      await transferFrom.should.be.rejectedWith(EVMThrow);

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(actualOwnerBalance, ownerBalance.toNumber());

      const foundersBalance = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(foundersBalance, reservedTokensForFounders.toNumber());

      const bountyProgramAllowance = (await this.token.allowance(owner, bountyProgram)).toNumber();
      assertEqual(bountyProgramAllowance, allowAmountForOwner.toNumber());
    });

    it('should not transfer tokens from one account to another if sender does not have enough allowance', async function () {
      const transferFrom = this.token.transferFrom(
        owner,
        founders,
        invalidAmountForOwner,
        { from: bountyProgram },
      );

      await transferFrom.should.be.rejectedWith(EVMThrow);

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(actualOwnerBalance, ownerBalance.toNumber());

      const foundersBalance = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(foundersBalance, reservedTokensForFounders.toNumber());

      const bountyProgramAllowance = (await this.token.allowance(owner, bountyProgram)).toNumber();
      assertEqual(bountyProgramAllowance, allowAmountForOwner.toNumber());
    });

    it('should not transfer tokens from one account to another if sender uses 0x0 address as destination account', async function () {
      const transferFrom = this.token.transferFrom(owner, 0x0, allowableAmountForOwner, { from: bountyProgram });

      await transferFrom.should.be.rejectedWith(EVMThrow);

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(actualOwnerBalance, ownerBalance.toNumber());

      const bountyProgramAllowance = (await this.token.allowance(owner, bountyProgram)).toNumber();
      assertEqual(bountyProgramAllowance, allowAmountForOwner.toNumber());
    });
  });
});
