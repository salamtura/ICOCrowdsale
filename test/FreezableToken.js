import { EVMThrow, assertTrue, assertFalse } from './utils';
import {
  getDefaultWallets,
} from './constants';

const MocrowCoin = artifacts.require('MocrowCoin');

contract('MocrowCoin', (wallets) => {
  const { owner, founders, bountyProgram, client3 } = getDefaultWallets(wallets);

  beforeEach(async function () {
    this.token = await MocrowCoin.new(founders, bountyProgram, client3);
  });

  describe('Freezable token tests', () => {
    it('should add wallets to the frozenlist', async function () {
      await this.token.freezeAccount(founders, { from: owner });

      const foundersAfterAdd = await this.token.isFrozen(founders);
      assertTrue(foundersAfterAdd);
    });

    it('should reject request for add wallet to the frozenlist if sender uses 0x0 address as a wallet', async function () {
      const frozenlist = this.token.freezeAccount(0x0, { from: owner });

      await frozenlist.should.be.rejectedWith(EVMThrow);
    });

    it('should reject request for add wallet to the frozenlist if sender is not an owner', async function () {
      const frozenlist = this.token.freezeAccount(founders, { from: bountyProgram });

      await frozenlist.should.be.rejectedWith(EVMThrow);

      const foundersAfterReject = await this.token.isFrozen(founders);
      assertFalse(foundersAfterReject);
    });

    it('should remove wallets from the frozenlist', async function () {
      await this.token.freezeAccount(founders, { from: owner });

      await this.token.unfreezeAccount(founders, { from: owner });

      const foundersAfterRemove = await this.token.isFrozen(founders);
      assertFalse(foundersAfterRemove);
    });

    it('should reject request for remove wallet from the frozenlist if sender uses 0x0 address as a wallet', async function () {
      const frozenlist = this.token.unfreezeAccount(0x0, { from: owner });

      await frozenlist.should.be.rejectedWith(EVMThrow);
    });

    it('should reject request for remove wallet from the frozenlist if sender is not an owner', async function () {
      await this.token.freezeAccount(founders, { from: owner });

      const frozenlist = this.token.unfreezeAccount(founders, { from: bountyProgram });

      await frozenlist.should.be.rejectedWith(EVMThrow);

      const foundersAfterReject = await this.token.isFrozen(founders);
      assertTrue(foundersAfterReject);
    });
  });
});
