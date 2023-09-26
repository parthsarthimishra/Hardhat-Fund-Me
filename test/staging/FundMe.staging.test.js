const { assert } = require("chai")
const { network, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", function () {
        let deployer
        let fundMe
        const sendValue = ethers.parseEther("0.1")
        beforeEach(async () => {

            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            console.log(deployer)
            const myContract = await deployments.get("FundMe");
            console.log(myContract)
            fundMe = await ethers.getContractAt(
                myContract.abi,
                myContract.address,

            );
        })

        it("allows people to fund and withdraw", async function () {
            console.log(fundMe)
            const fundTxResponse = await fundMe.fund({ value: sendValue })
            await fundTxResponse.wait(1)
            const withdrawTxResponse = await fundMe.withdraw()
            await withdrawTxResponse.wait(1)

            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.target
            )
            console.log(
                endingFundMeBalance.toString() +
                " should equal 0, running assert equal..."
            )
            assert.equal(endingFundMeBalance.toString(), "0")
            //done()
        })
    })