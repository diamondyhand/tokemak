# 🚩 Redeem

Approves max uint256 on creation for the toToken against the staking contract.

## Main Action 🔧

> function **convert**()
Allows a holder of fromToken to convert into toToken and simultaneously stake within the stakingContract.
A user must approve this contract in order for it to burnFrom().

```js
    function convert()
```

> function **recoupRemaining**()
Allows the claim on the toToken balance after the expiration has passed.
Callable only by owner.

```js
    function recoupRemaining() external onlyOwner;
```