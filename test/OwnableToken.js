import { EVMThrow, assertEqual } from './utils';
import { getDefaultWallets } from './constants';

const MocrowCoin = artifacts.require('MocrowCoin');

contract('MocrowCoin', (wallets) => {
  const { owner, founders, bountyProgram, client3 } = getDefaultWallets(wallets);

  beforeEach(async function () {
    // given
    this.token = await MocrowCoin.new(founders, bountyProgram, client3);
  });

  describe('Ownable token tests', () => {
    it('should set token creator as owner', async function () {
      // then
      const tokenOwner = await this.token.owner();
      assertEqual(tokenOwner, owner);
    });

    it('should transfer ownership to another account', async function () {
      // when
      await this.token.transferOwnership(founders, { from: owner });

      // then
      const tokenOwner = await this.token.owner();
      assertEqual(tokenOwner, founders);
    });

    it('should reject the request for transfer ownership if sender is not an owner', async function () {
      // when
      const transferOwnership = this.token.transferOwnership(founders, { from: bountyProgram });

      // then
      await transferOwnership.should.be.rejectedWith(EVMThrow);

      const tokenOwner = await this.token.owner();
      assertEqual(tokenOwner, owner);
    });
  });
});
