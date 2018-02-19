import { ether } from './utils';

const ether1 = ether(1).toNumber();
const div = 10;
const HARDCAP_TOKENS_PRE_ICO = ether(36000000);
const HARDCAP_TOKENS_ICO = ether(84000000);

export const reservedTokensForFounders = ether(23500000);
export const validAmountForFounders = reservedTokensForFounders.div(div);
export const invalidAmountForFounders = reservedTokensForFounders.add(ether1);

export const reservedTokensForBountyProgram = ether(9480000);
export const validAmountForBountyProgram = reservedTokensForBountyProgram.div(div);
export const invalidAmountForBountyProgram = reservedTokensForBountyProgram.add(ether1);

export const reservedTokensForPlatformOperations = ether(70588235);

export const compaignAllocationAndBonusesTokens = ether(11725883);

export const tokensRemainingPreIco = HARDCAP_TOKENS_PRE_ICO;
export const tokensRemainingIco = HARDCAP_TOKENS_PRE_ICO.add(HARDCAP_TOKENS_ICO);

export const totalSupply = ether(235294118);

export const ownerBalance = totalSupply
  .sub(reservedTokensForFounders)
  .sub(reservedTokensForBountyProgram)
  .sub(reservedTokensForPlatformOperations);
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
