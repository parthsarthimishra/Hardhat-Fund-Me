const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { mock } = require("node:test")


!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
        let fundMe
        let mockV3Aggregator
        let deployer
        const sendValue = ethers.parseEther("1")
        beforeEach(async () => {
            // const accounts = await ethers.getSigners()
            // deployer = accounts[0]
            deployer = (await getNamedAccounts()).deployer
            console.log(`deployer is : ${deployer}`)
            await deployments.fixture(["all"])
            const myContract = await deployments.get("FundMe");
            //console.log(myContract)
            //console.log(`myContract.adress : ${myContract.address}`)
            //console.log(`deployer : ${deplo}`)
            fundMe = await ethers.getContractAt(
                myContract.abi,
                myContract.address,

            );
            //console.log(fundMe)
            //fundMe = await ethers.getContractAt("FundMe", deployer)\
            const mymockV3Aggregator = await deployments.get("MockV3Aggregator");
            mockV3Aggregator = await ethers.getContractAt(
                mymockV3Aggregator.abi,
                mymockV3Aggregator.address
            )
            //console.log(mockV3Aggregator)
            //console.log(fundMe)
        })

        describe("constructor", function () {
            it("sets the aggregator addresses correctly", async () => {
                //console.log(`agar yaha kuch print hua matlab soni bhadwa hai`)
                const response = await fundMe.getPriceFeed()
                //console.log(`respponsrejunb : ${response}`)
                //console.log(mockV3Aggregator)
                assert.equal(response, mockV3Aggregator.target)
            })
        })

        describe("fund", function () {
            // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
            // could also do assert.fail
            it("Fails if you don't send enough ETH", async () => {
                await expect(fundMe.fund()).to.be.revertedWith(
                    "You need to spend more ETH!"
                )
            })
            // we could be even more precise here by making sure exactly $50 works
            // but this is good enough for now
            it("Updates the amount funded data structure", async () => {
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getAddressToAmountFunded(
                    deployer
                )
                assert.equal(response.toString(), sendValue.toString())
            })
            it("Adds funder to array of funders", async () => {
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getFunder(0)
                assert.equal(response, deployer)
            })
        })
        describe("withdraw", function () {
            beforeEach(async () => {
                await fundMe.fund({ value: sendValue })
            })
            it("withdraws ETH from a single funder", async () => {
                // Arrange
                const startingFundMeBalance =
                    await ethers.provider.getBalance(fundMe.target)
                const startingDeployerBalance =
                    await ethers.provider.getBalance(deployer)

                // Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait()
                //console.log(transactionReceipt)
                const { gasUsed, gasPrice } = transactionReceipt
                console.log(`gasUsed : ${gasUsed} , effectiveGasPrice : ${gasPrice}`)
                // gasUsed = BigNumber.from(gasUsed)
                // gasPrice = BigNumber.from(gasPrice)
                // console.log(`is gasUsed big number : ${ethers.BigNumber.isBigNumber(gasUsed)}`)
                const gasCost = gasUsed * gasPrice

                const endingFundMeBalance = await ethers.provider.getBalance(
                    fundMe.target
                )
                const endingDeployerBalance =
                    await ethers.provider.getBalance(deployer)

                // Assert
                // Maybe clean up to understand the testing
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    (startingFundMeBalance + startingDeployerBalance).toString()
                    ,
                    (endingDeployerBalance + gasCost).toString()
                )
            })
            // this test is overloaded. Ideally we'd split it into multiple tests
            // but for simplicity we left it as one
            it("is allows us to withdraw with multiple funders", async () => {
                // Arrange
                const accounts = await ethers.getSigners()
                for (i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                //console.log(fundMe.target)
                //console.log(ethers.getAddress(fundMe))
                const startingFundMeBalance =
                    await ethers.provider.getBalance(fundMe.target)
                const startingDeployerBalance =
                    await ethers.provider.getBalance(deployer)

                // Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait()
                //console.log(transactionReceipt)
                const { gasUsed, gasPrice } = transactionReceipt
                console.log(`gasUsed : ${gasUsed} , effectiveGasPrice : ${gasPrice}`)
                // gasUsed = BigNumber.from(gasUsed)
                // gasPrice = BigNumber.from(gasPrice)
                // console.log(`is gasUsed big number : ${ethers.BigNumber.isBigNumber(gasUsed)}`)
                const withdrawGasCost = gasUsed * gasPrice

                const endingFundMeBalance = await ethers.provider.getBalance(
                    fundMe.target
                )
                const endingDeployerBalance =
                    await ethers.provider.getBalance(deployer)
                // Assert
                assert.equal(
                    (startingFundMeBalance + startingDeployerBalance).toString(),
                    (endingDeployerBalance + withdrawGasCost).toString()
                )
                // Make a getter for storage variables
                await expect(fundMe.getFunder(0)).to.be.reverted

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    )
                }
            })
            it("Only allows the owner to withdraw", async function () {
                const accounts = await ethers.getSigners()
                //console.log(accounts[0]);
                //console.log(accounts[1]);
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[1]
                )
                //console.log(await fundMeConnectedContract.withdraw())
                await expect(
                    fundMeConnectedContract.withdraw()
                ).to.be.revertedWithCustomError(fundMeConnectedContract, "FundMe__NotOwner")
            })
        })
    })