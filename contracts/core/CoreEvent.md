# 🚩 CoreEvent

## Main Action 🔧

> function **configureWhitelist**()
Enable or disable the whitelist.

```js
    /**
     * @param settings The root to use and whether to check the whitelist at all
     */
    function configureWhitelist(
        WhitelistSettings memory settings
    )
```

> function **setDuration**()
Defines the length in blocks the round will run for.
Round is started via this call and it is only callable one time.

```js
    /**
     * @param blockDuration Duration in blocks the deposit/withdraw portion will run for
     */
    function setDuration(
        uint256 blockDuration
    )
```

> function **addSupportedTokens**()
Adds tokens to support.

```js
    /**
     * @param tokensToSupport an array of supported token structs
     */
    function addSupportedTokens(
        SupportedTokenData[] memory tokensToSupport
    )
```

> function **deposit**()
Deposits tokens into the round contract.

```js
    /**
     * @param tokenData an array of token structs
     * @param proof Merkle proof for the user. Only required if whitelistSettings.enabled
     */
    function deposit(
        TokenData[] calldata tokenData, 
        bytes32[] calldata proof    
    )
```

> function **withdraw**()
Withdraws tokens from the round contract

```js
    /**
     * @param tokenData an array of token structs
     */
    function withdraw(
        TokenData[] calldata tokenData   
    )
```

> function **increaseDuration**()
Extends the deposit/withdraw stage.
Only extendable if no tokens have been finalized and no rates set.

```js
    /**
     * @param blockDuration Duration in blocks the deposit/withdraw portion will run for. Must be greater than original.
     */
    function increaseDuration(
        TokenData[] calldata tokenData   
    )
```


> function **setRates**()
Once the expected duration has passed, publish the Toke and over subscription rates.
Tokens which do not have a published rate will have their users forced to withdraw all funds. Pass a tokeNumerator of 0 to delete a set rate.
Cannot be called for a token once transferToTreasury/setNoSwap has been called for that token.

```js
    function setRates(
        RateData[] calldata rates
    )
```

> function **transferToTreasury**()
Allows the owner to transfer the effective balance of a token based on the set rate to the treasury.
Dev only callable by owner and if rates have been set. Dev is only callable one time for a token.

```js
    function transferToTreasury(
        address[] calldata tokens
    )

```

> function **setNoSwap**()
Marks a token as finalized but not swapping.
Complement to transferToTreasury which is for tokens that will be swapped, this one for ones that won't.

```js
    function setNoSwap(
        address[] calldata tokens
    )
```


> function **finalize**()
Once rates have been published, and the token finalized via transferToTreasury/setNoSwap, either refunds or sends to private farming.

```js
    /**
     * @param tokens an array of tokens and whether to send them to private farming.  False on farming will send back to user.
     */
    function finalize(
        TokenFarming[] calldata tokens
    )
```

> function **getRateAdjustedAmounts**()
Breaks down the balance according to the published rates.
Dev only callable after rates have been set.

```js
    function getRateAdjustedAmounts(
        uint256 balance, 
        address token        
    )
```

> function **getRates**()
Return the published rates for the tokens.

```js
    function getRates()
```

> function **getAccountData**()
Returns a list of AccountData for a provided account.

```js
    /**
     * @param account the address of the account
     * @return data an array of AccountData denoting what the status is for each of the tokens deposited (if any)
     */
    function getAccountData(
        address account
    )
```

> function **getSupportedTokens**()
Get all tokens currently supported by the contract.

```js
    /**
     * @return supportedTokensArray an array of supported token structs
     */
    function getSupportedTokens()
```