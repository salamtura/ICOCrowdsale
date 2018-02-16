export default (() => {
  const addSeconds = seconds => (
    new Promise((resolve, reject) =>
      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [seconds],
        id: new Date().getTime(),
      }, (err1) => {
        if (err1) return reject(err1);
        return web3.currentProvider.sendAsync({
          jsonrpc: '2.0',
          method: 'evm_mine',
          id: new Date().getTime() + 1,
        }, (err2, res) => (err2 ? reject(err2) : resolve(res)));
      }))
  );
  const addDays = days => addSeconds(days * 24 * 60 * 60);
  const currentTimestamp = () =>
    new web3.BigNumber(web3.eth.getBlock(web3.eth.blockNumber).timestamp);
  return {
    addSeconds,
    addDays,
    currentTimestamp,
  };
})();
