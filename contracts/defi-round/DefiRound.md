# 🚩 DefiRound

## Main Action 🔧

> function **configureWhitelist**()
Enable or disable the whitelist

```js
    /**
     * @param settings The root to use and whether to check the whitelist at all
     */
    function configureWhitelist(
        WhitelistSettings memory settings
    )
```
> function **currentStage**()
Returns the current stage the contract is in.

```js
    /**
     * @return stage the current stage the round contract is in
     */
    function currentStage() external;
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

> function **totalVaule**()
Total value held in the entire contract amongst all the assets

```js
    /**
     * @return value the value of all assets held.
     */
    function totalValue() external;
```

> function **getMaxTotalValue**()
Current Max Total Value.
```js
    /**
     * @return value the max total value.
     */
    function getMaxTotalValue() external;
```

> function **treasury**()
Returns the address of the treasury, when users claim this is where funds that are <= maxClaimableValue go

```js
    /**
     * @return treasuryAddress address of the treasury
     */
    function treasury() external;
```

> function **totalSupply**()
The total supply held for a given token.

```js
    /**
     * @param token the token to get the supply for.
     * @return amount the total supply for a given token.
     */
    function totalSupply(
        address token
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

> function **addSupportedTokens**()
Adds tokens to support.

```js
    /**
     * @param tokensToSupport an array of supported token structs
     */
    function addSupportedTokens(
        SupportedTokenData[] calldata tokensToSupport
    )
```

> function **getSupportedTokens**()
Returns which tokens can be deposited.

```js
    /**
     * @return tokens tokens that are supported for deposit.
     */
    function getSupportedTokens()
```

> function **getTokenOracles**()
The oracle that will be used to denote how much the amounts deposited are worth in USD.

```js
    /**
     * @param tokens an array of tokens
     * @return oracleAddresses the an array of oracles corresponding to supported tokens.
     */
    function getTokenOracles(address[] calldata tokens)
```

> function **publishRates**()
publishes rates for the tokens. Rates are always relative to 1 TOKE. Can only be called once within Stage 1 prices can be published at any time.

```js
    /***
     * @param ratesData an array of rate info structs
     */
    function publishRates(
        RateData[] calldata ratesData,
        OversubscriptionRate memory overSubRate,
        uint256 lastLookDuration        
    )
```

> function **getRate**()
Return the published rates for the tokens.

```js
    /***
     * @param tokens an array of tokens to get rates for
     * @returns rates an array of rates for the provided tokens.
     */
    function getRates(
        address[] calldata tokens
    )
```

> function **accountBalance**()
Determines the account value in USD amongst all the assets the user is invovled in.
```js
    /**
     * @param account the account to look up
     * @return value the value of the account in USD
     */
    function accountBalance(
        address account
    )
```

> function **finalizeAssets**()
Moves excess assets to private farming or refunds them.
Dev uses the publishedRates, selected tokens, and amounts to determine what amount of TOKE is claimed.
When true oversubscribed amount will deposit to genesis, else oversubscribed amount is sent back to user.

```js
    /***
     * @param depositToGenesis applies only if oversubscribedMultiplier < 1;
     */
    function finalizeAssets(
        bool depositToGenesis
    )
``` 

> function **getGenesisPools**()
Returns what gensis pool a supported token is mapped to.

```js
    /**
     * @param tokens array of addresses of supported tokens
     * @return genesisAddresses array of genesis pools corresponding to supported tokens
     */
    function getGenesisPools(
        address[] calldata tokens
    )
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
    ) external view returns (AccountDataDetails[] calldata data);
```

> function **transferToTreasury**()
Allows the owner to transfer all swapped assets to the treasury.
Dev only callable by owner and if last look period is complete.

```js
    function transferToTreasury() external;
```

> function **getRateAdjustedAmounts**()
Given a balance, calculates how the the amount will be allocated between TOKE and Farming.
Dev Only allowed at stage 3.

```js
    /**
     * @param balance balance to divy up
     * @param token token to pull the rates for
     */
    function getRateAdjustedAmounts(
        uint256 balance, 
        address token
    ) external view returns (
        uint256,
        uint256,
        uint256
    );
```