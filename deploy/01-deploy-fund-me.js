const { getNamedAccounts, deployments } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { Module } = require("module");
const { verify } = require("../utils/verify");
// function deployFunc() {
//     console.log("hi");
// }

// module.exports.default = deployFunc;

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    //
    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    // if contract doesnt exist , create minimal version for local test
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        //console.log(ethUsdAggregator);
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],//put price feed address
        log: true,
        waitConfirmation: network.config.blockConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args)

    }
    log("______________________");

}
module.exports.tags = ["all", "fundme"]