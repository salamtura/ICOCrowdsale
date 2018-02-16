import { EVMThrow, assertEqual } from './utils';
import {
  reservedTokensForFounders,
  validAmountForFounders,
  reservedTokensForBountyProgram,
  ownerBalance,
  totalSupply,
  getDefaultWallets,
} from './constants';

const MocrowCoin = artifacts.require('MocrowCoin');
const RecipientContract = artifacts.require('RecipientContract');

contract('MocrowCoin', (wallets) => {
  const { owner, founders, bountyProgram, withdrawal1, client3 } = getDefaultWallets(wallets);

  describe('should have correct parameters', function () {
    const expectedTokenName = 'MOCROW COIN';
    const expectedTokenSymbol = 'MCW';
    const expectedTokenDecimals = 18;
    before(async () => {
      this.token = await MocrowCoin.new(founders, bountyProgram, client3);
    });

    it('name', async () => {
      const tokenName = await this.token.name();
      assertEqual(tokenName, expectedTokenName);
    });

    it('symbol', async () => {
      const tokenSymbol = await this.token.symbol();
      assertEqual(tokenSymbol, expectedTokenSymbol);
    });

    it('decimals', async () => {
      const tokenDecimals = (await this.token.decimals()).toNumber();
      assertEqual(tokenDecimals, expectedTokenDecimals);
    });

    it('RESERVED_TOKENS_FOR_FOUNDERS', async () => {
      const actualReservedTokensForFounders = (await this.token.RESERVED_TOKENS_FOR_FOUNDERS()).toNumber();
      assertEqual(actualReservedTokensForFounders, reservedTokensForFounders.toNumber());
    });

    it('RESERVED_TOKENS_FOR_BOUNTY_PROGRAM', async () => {
      const actualReservedTokensForBountyProgram = (await this.token.RESERVED_TOKENS_FOR_BOUNTY_PROGRAM()).toNumber();
      assertEqual(actualReservedTokensForBountyProgram, reservedTokensForBountyProgram.toNumber());
    });

    it('TOTAL_SUPPLY_VALUE', async () => {
      const actualTotalSupplyValue = (await this.token.TOTAL_SUPPLY_VALUE()).toNumber();
      assertEqual(actualTotalSupplyValue, totalSupply.toNumber());
    });
  });

  describe('should transfer tokens right', function () {
    beforeEach(async () => {
      this.token = await MocrowCoin.new(founders, bountyProgram, client3);

      await this.token.approve(bountyProgram, validAmountForFounders, { from: founders });
    });
    it('function transfer', async () => {
      await this.token.transfer(
        bountyProgram,
        validAmountForFounders,
        { from: founders },
      );

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.sub(validAmountForFounders).toNumber(),
      );

      const actualReservedTokensForBountyProgram = (await this.token.balanceOf(bountyProgram)).toNumber();
      assertEqual(
        actualReservedTokensForBountyProgram,
        reservedTokensForBountyProgram.add(validAmountForFounders).toNumber(),
      );
    });

    it('function transferFrom', async () => {
      await this.token.transferFrom(
        founders,
        owner,
        validAmountForFounders,
        { from: bountyProgram },
      );

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.sub(validAmountForFounders).toNumber(),
      );

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(
        actualOwnerBalance,
        ownerBalance.add(validAmountForFounders).toNumber(),
      );
    });

    it('should reject the request to function transfer if the contract is paused', async () => {
      await this.token.pause({ from: owner });

      const transfer = this.token.transfer(
        bountyProgram,
        validAmountForFounders,
        { from: founders },
      );

      await transfer.should.be.rejectedWith(EVMThrow);

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.toNumber(),
      );

      const actualReservedTokensForBountyProgram = (await this.token.balanceOf(bountyProgram)).toNumber();
      assertEqual(
        actualReservedTokensForBountyProgram,
        reservedTokensForBountyProgram.toNumber(),
      );
    });

    it('should reject the request to function transferFrom if the contract is paused', async () => {
      await this.token.pause({ from: owner });

      const transferFrom = this.token.transferFrom(
        founders,
        owner,
        validAmountForFounders,
        { from: bountyProgram },
      );

      await transferFrom.should.be.rejectedWith(EVMThrow);

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.toNumber(),
      );

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(
        actualOwnerBalance,
        ownerBalance.toNumber(),
      );
    });



    it('function transfer to freezed acсount', async () => {
      await this.token.freezeAccount(bountyProgram, { from: owner });

      await this.token.transfer(
        bountyProgram,
        validAmountForFounders,
        { from: founders },
      );

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.sub(validAmountForFounders).toNumber(),
      );

      const actualReservedTokensForBountyProgram = (await this.token.balanceOf(bountyProgram)).toNumber();
      assertEqual(
        actualReservedTokensForBountyProgram,
        reservedTokensForBountyProgram.add(validAmountForFounders).toNumber(),
      );
    });

    it('function transferFrom to freezed acсount', async () => {
      await this.token.freezeAccount(withdrawal1, { from: owner });

      const withdrawal1Balance = await this.token.balanceOf(withdrawal1);
      await this.token.transferFrom(
        founders,
        withdrawal1,
        validAmountForFounders,
        { from: bountyProgram },
      );

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.sub(validAmountForFounders).toNumber(),
      );

      const actualWithdrawal1Balance = (await this.token.balanceOf(withdrawal1)).toNumber();
      assertEqual(
        actualWithdrawal1Balance,
        withdrawal1Balance.add(validAmountForFounders).toNumber(),
      );
    });



    it('should reject the request to function transfer if sender balance is frozen', async () => {
      await this.token.freezeAccount(founders, { from: owner });

      const transfer = this.token.transfer(
        bountyProgram,
        validAmountForFounders,
        { from: founders },
      );

      await transfer.should.be.rejectedWith(EVMThrow);

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.toNumber(),
      );

      const actualReservedTokensForBountyProgram = (await this.token.balanceOf(bountyProgram)).toNumber();
      assertEqual(
        actualReservedTokensForBountyProgram,
        reservedTokensForBountyProgram.toNumber(),
      );
    });

    it('should reject the request to function transferFrom if sender balance is frozen', async () => {
      await this.token.freezeAccount(bountyProgram, { from: owner });

      const transferFrom = this.token.transferFrom(
        founders,
        owner,
        validAmountForFounders,
        { from: bountyProgram },
      );

      await transferFrom.should.be.rejectedWith(EVMThrow);

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.toNumber(),
      );

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(
        actualOwnerBalance,
        ownerBalance.toNumber(),
      );
    });

    it('should reject the request to function transferFrom if token owner balance is frozen', async () => {
      await this.token.freezeAccount(founders, { from: owner });

      const transferFrom = this.token.transferFrom(
        founders,
        owner,
        validAmountForFounders,
        { from: bountyProgram },
      );

      await transferFrom.should.be.rejectedWith(EVMThrow);

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.toNumber(),
      );

      const actualOwnerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(
        actualOwnerBalance,
        ownerBalance.toNumber(),
      );
    });

    it('should allow the tokens transfer to contract', async () => {
      const recipient = await RecipientContract.new();
      await recipient.setForward(bountyProgram, { from: owner });
      const recipientAddress = recipient.address;

      await this.token.approveAndCall(
        recipientAddress,
        validAmountForFounders,
        0,
        { from: founders },
      );

      const actualReservedTokensForFounders = (await this.token.balanceOf(founders)).toNumber();
      assertEqual(
        actualReservedTokensForFounders,
        reservedTokensForFounders.sub(validAmountForFounders).toNumber(),
      );

      const actualReservedTokensForBountyProgram = (await this.token.balanceOf(bountyProgram)).toNumber();
      assertEqual(
        actualReservedTokensForBountyProgram,
        reservedTokensForBountyProgram.add(validAmountForFounders).toNumber(),
      );
    });
  });
});
