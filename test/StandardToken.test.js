
const { assertRevert } = require('./helpers/assertRevert');

var Token = artifacts.require("./Token.sol");

contract('StandardToken - Token', function (accounts) {
    let token;
    let owner = accounts[0]

    beforeEach(async function () {

        let tokenArguments = [
            owner,
            100,
            [owner, accounts[2], accounts[3]],
            [100, 0, 0],
            [0,0,0]
        ]


        token = await Token.new(...tokenArguments, {from: owner});

        await token.changeCrowdfundStartTime(10, {from: owner});
        await token.unlockTokens({from: owner});
        await token.moveAllocation(owner, 100);

    });

    it('should return the correct totalSupply after construction', async function () {
        let totalSupply = await token.totalSupply();

        assert.equal(totalSupply, 100);
    });

    it('should return the correct allowance amount after approval', async function () {
        await token.approve(accounts[1], 100);
        let allowance = await token.allowance(accounts[0], accounts[1]);

        assert.equal(allowance, 100);
    });

    it('should return correct balances after transfer', async function () {
        await token.transfer(accounts[1], 100);
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0, 0);

        let balance1 = await token.balanceOf(accounts[1]);
        assert.equal(balance1, 100);
    });

    it('should throw an error when trying to transfer more than balance', async function () {
        await assertRevert(token.transfer(accounts[1], 101));
    });

    it('should return correct balances after transfering from another account', async function () {
        await token.approve(accounts[1], 100);
        await token.transferFrom(accounts[0], accounts[2], 100, { from: accounts[1] });

        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0, 0);

        let balance1 = await token.balanceOf(accounts[2]);
        assert.equal(balance1, 100);

        let balance2 = await token.balanceOf(accounts[1]);
        assert.equal(balance2, 0);
    });

    it('should throw an error when trying to transfer more than allowed', async function () {
        await token.approve(accounts[1], 99);
        await assertRevert(token.transferFrom(accounts[0], accounts[2], 100, { from: accounts[1] }));
    });

    it('should throw an error when trying to transferFrom more than _from has', async function () {
        let balance0 = await token.balanceOf(accounts[0]);
        await token.approve(accounts[1], 99);
        await assertRevert(token.transferFrom(accounts[0], accounts[2], balance0 + 1, { from: accounts[1] }));
    });

    describe('validating allowance updates to spender', function () {
        let preApproved;

        it('should start with zero', async function () {
            preApproved = await token.allowance(accounts[0], accounts[1]);
            assert.equal(preApproved, 0);
        });

        it('should increase by 50 then decrease by 10', async function () {
            await token.increaseApproval(accounts[1], 50);
            let postIncrease = await token.allowance(accounts[0], accounts[1]);
            assert.equal(postIncrease, 50, "Should set to 50")
            await token.decreaseApproval(accounts[1], 10);
            let postDecrease = await token.allowance(accounts[0], accounts[1]);
            assert.equal(postDecrease, 40, "Should set to 40")
        });
    });

    it('should increase by 50 then set to 0 when decreasing by more than 50', async function () {
        await token.approve(accounts[1], 50);
        await token.decreaseApproval(accounts[1], 60);
        let postDecrease = await token.allowance(accounts[0], accounts[1]);
        assert.equal(postDecrease, 0, "Should set to 0")
    });

    it('should throw an error when trying to transfer to 0x0', async function () {
        await assertRevert(token.transfer(0x0, 100));
    });

    it('should throw an error when trying to transferFrom to 0x0', async function () {
        await token.approve(accounts[1], 100);
        await assertRevert(token.transferFrom(accounts[0], 0x0, 100, { from: accounts[1] }));
    });
});
