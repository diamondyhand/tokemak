# CurveControllerV2Template

We can Deploy, Withdraw liquidity Pool using This contract.
We trust sender to send a true curve poolAddress.

## Main Action 🔧

> function **deploy**()
We trust sender to send a true curve poolAddress.
If it's not the case it will fail in the add_liqudity part.

```js
    /**
     * @notice Deploy liquidity to Curve pool
     * @dev Calls to external contract
     * @param poolAddress Meta pool address
     * @param amounts List of amounts of coins to deposit
     * @param minMintAmount Minimum amount of LP tokens to mint from the deposit
     */
    function deploy(
        address poolAddress,
        uint256[N_COINS] calldata amounts,
        uint256 minMintAmount
    )
```

> function **withdrawImbalance**()
We trust sender to send a true curve poolAddress. 
If it's not the case it will fail in the remove_liquidity_imbalance part.

```js
    /**
     * @notice Withdraw liquidity from Curve pool
     * @dev Calls to external contract
     * @dev We trust sender to send a true curve poolAddress. If it's not the case it will fail in the remove_liquidity_imbalance part.
     * @param poolAddress Meta pool address
     * @param amounts List of amounts of underlying coins to withdraw
     * @param maxBurnAmount Maximum amount of LP token to burn in the withdrawal
     */
    function withdrawImbalance(
        address poolAddress,
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


> function **withdrawOneCoin**()
We trust sender to send a true curve poolAddress. 
If it's not the case it will fail in the remove_liquidity_one_coin part.

```js
    /** 
     * @notice Withdraw liquidity from Curve pool
     * @dev Calls to external contract
     * @dev We trust sender to send a true curve poolAddress. If it's not the case it will fail in the remove_liquidity_one_coin part.
     * @param poolAddress token addresses
     * @param tokenAmount Amount of LP tokens to burn in the withdrawal
     * @param i Index value of the coin to withdraw
     * @param minAmount Minimum amount of coin to receive
     */
    function withdrawOneCoin(
        address poolAddress,
        uint256 tokenAmount,
        int128 i,
        uint256 minAmount
    )
```