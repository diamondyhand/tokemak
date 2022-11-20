# CurveControllerMetaPool3

We can Deploy, Withdraw liquidity Pool using This contract.
We trust sender to send a true curve poolAddress.

## Main Action 🔧

> function **deploy**()
We trust sender to send a true curve metaPoolAddress.
If it's not the case it will fail in the add_liqudity part.

```js
    /**
     * @notice Deploy liquidity to Curve pool using Deposit Zap
     * @dev Calls to external contract
     * @param metaPoolAddress Meta pool address
     * @param amounts List of amounts of coins to deposit
     * @param minMintAmount Minimum amount of LP tokens to mint from the deposit
     */
    function deploy(
        address metaPoolAddress,
        uint256[N_COINS] calldata amounts,
        uint256 minMintAmount
    )
```

> function **withdrawImbalance**()
We trust sender to send a true curve metaPoolAddress. 
If it's not the case it will fail in the remove_liquidity_imbalance part.

```js
    /**
     * @notice Withdraw liquidity from Curve pool
     * @dev Calls to external contract
     * @dev We trust sender to send a true curve metaPoolAddress. If it's not the case it will fail in the remove_liquidity_imbalance part.
     * @param metaPoolAddress Meta pool address
     * @param amounts List of amounts of underlying coins to withdraw
     * @param maxBurnAmount Maximum amount of LP token to burn in the withdrawal
     */
    function withdrawImbalance(
        address metaPoolAddress,
        uint256[N_COINS] memory amounts,
        uint256 maxBurnAmount
    )
```

> function **withdraw**()
We trust sender to send a true curve poolAddress. 
If it's not the case it will fail in the remove_liquidity part.

```js
    /** 
     * @notice Withdraw liquidity from Curve pool
     * @dev Calls to external contract
     * @dev We trust sender to send a true curve poolAddress. If it's not the case it will fail in the remove_liquidity part.
     * @param poolAddress Token addresses
     * @param amount Quantity of LP tokens to burn in the withdrawal
     * @param minAmounts Minimum amounts of underlying coins to receive
    */
    function withdraw(
        address poolAddress,
        uint256 amount,
        uint256[N_COINS] memory minAmounts
    )
```