const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts()

    //console.log(`deployer is : ${deployer}`)
    //await deployments.fixture(["all"])
    const myContract = await deployments.get("FundMe");
    //console.log(myContract)
    //console.log(`myContract.adress : ${myContract.address}`)
    //console.log(`deployer : ${deplo}`)
    fundMe = await ethers.getContractAt(
        myContract.abi,
        myContract.address,

    );
    console.log("Funding Contract")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Funding of 0.1 eth done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })