# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
I've deployed RandomIpfsNft with wrong ```i_callbackGasLimit``` by mistake (this value is less than gas requirements of ```fullfillRandomWords```). More carefull when deploying smart contracts next time. 
