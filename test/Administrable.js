import { EVMThrow, assertEqual, assertTrue, assertFalse } from './utils';
import { getDefaultWallets } from './constants';

const Administrable = artifacts.require('Administrable');

contract('Administrable', (wallets) => {
  const { owner, founders, bountyProgram, withdrawal1 } = getDefaultWallets(wallets);

  beforeEach(async function () {
    this.administrable = await Administrable.new({ from: owner });
  });

  describe('Administrable tests', () => {
    it('should have correct parameters after creation', async function () {
      const ownerAddress = await this.administrable.owner();
      assertEqual(ownerAddress, owner);

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 0);
    });

    it('should add administrator', async function () {
      await this.administrable.addAdministrator(founders, { from: owner });
      await this.administrable.addAdministrator(bountyProgram, { from: owner });

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 2);

      const foundersAfterAdd = await this.administrable.isAdministrator(founders);
      assertTrue(foundersAfterAdd);

      const bountyProgramAfterAdd = await this.administrable.isAdministrator(bountyProgram);
      assertTrue(bountyProgramAfterAdd);
    });

    it('should reject request for add administrator if sender uses 0x0 address as an administrator', async function () {
      const administrable = this.administrable.addAdministrator(0x0, { from: owner });

      await administrable.should.be.rejectedWith(EVMThrow);

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 0);
    });

    it('should reject request for add administrator if sender uses administrator address', async function () {
      await this.administrable.addAdministrator(founders, { from: owner });

      const administrable = this.administrable.addAdministrator(founders, { from: owner });

      await administrable.should.be.rejectedWith(EVMThrow);

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 1);

      const foundersAfterAdd = await this.administrable.isAdministrator(founders);
      assertTrue(foundersAfterAdd);
    });

    it('should reject request for add administrator if sender is not an owner', async function () {
      const administrable = this.administrable.addAdministrator(founders, { from: withdrawal1 });

      await administrable.should.be.rejectedWith(EVMThrow);

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 0);

      const foundersAfterReject = await this.administrable.isAdministrator(founders);
      assertFalse(foundersAfterReject);
    });

    it('should remove administrator', async function () {
      await this.administrable.addAdministrator(founders, { from: owner });
      await this.administrable.addAdministrator(bountyProgram, { from: owner });

      await this.administrable.removeAdministrator(founders, { from: owner });
      await this.administrable.removeAdministrator(bountyProgram, { from: owner });

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 0);

      const foundersAfterRemove = await this.administrable.isAdministrator(founders);
      assertFalse(foundersAfterRemove);

      const bountyProgramAfterRemove = await this.administrable.isAdministrator(founders);
      assertFalse(bountyProgramAfterRemove);
    });

    it('should reject request for remove administrator if sender uses 0x0 address as an administrator', async function () {
      await this.administrable.addAdministrator(founders, { from: owner });

      const administrable = this.administrable.removeAdministrator(0x0, { from: owner });

      await administrable.should.be.rejectedWith(EVMThrow);

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 1);
    });

    it('should reject request for remove administrator if sender uses not administrator address', async function () {
      await this.administrable.addAdministrator(founders, { from: owner });

      const administrable = this.administrable.removeAdministrator(bountyProgram, { from: owner });

      await administrable.should.be.rejectedWith(EVMThrow);

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 1);

      const bountyProgramAfterReject = await this.administrable.isAdministrator(bountyProgram);
      assertFalse(bountyProgramAfterReject);
    });

    it('should reject request for remove administrator if sender is not an owner', async function () {
      await this.administrable.addAdministrator(founders, { from: owner });

      const administrable = this.administrable.removeAdministrator(founders, { from: withdrawal1 });

      await administrable.should.be.rejectedWith(EVMThrow);

      const administratorsLength = (await this.administrable.administratorsLength()).toNumber();
      assertEqual(administratorsLength, 1);

      const foundersAfterReject = await this.administrable.isAdministrator(founders);
      assertTrue(foundersAfterReject);
    });
  });
});
