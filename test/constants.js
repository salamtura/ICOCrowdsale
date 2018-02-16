import { ether } from './utils';

const ether1 = ether(1).toNumber();
const div = 10;

export const reservedTokensForFounders = ether(23500000);
export const validAmountForFounders = reservedTokensForFounders.div(div);
export const invalidAmountForFounders = reservedTokensForFounders.add(ether1);

export const reservedTokensForBountyProgram = ether(9480000);
export const validAmountForBountyProgram = reservedTokensForBountyProgram.div(div);
export const invalidAmountForBountyProgram = reservedTokensForBountyProgram.add(ether1);

export const totalSupply = ether(235294118);

export const ownerBalance = totalSupply.sub(reservedTokensForFounders).sub(reservedTokensForBountyProgram);
export const validAmountForOwner = ownerBalance.div(div);
export const invalidAmountForOwner = ownerBalance.add(ether1);

export const getDefaultWallets = wallets => ({
  owner: wallets[0],
  founders: wallets[1],
  bountyProgram: wallets[2],
  withdrawal1: wallets[3],
  withdrawal2: wallets[4],
  withdrawal3: wallets[5],
  withdrawal4: wallets[6],
  client1: wallets[7],
  client2: wallets[8],
  client3: wallets[9],
});

export const constructorThrow = 'VM Exception while processing transaction: invalid opcode';
