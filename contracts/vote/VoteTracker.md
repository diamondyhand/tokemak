# 🚩 VoteTracker

Track and tally votes made to reactors, exchanges, pairs, etc.
Setup to accept votes submitted directly, via a bridge, or the gasless API with an EIP712/eth_sign'd message.

## Main Action 🔧

> function **userNonces**()
Get the current nonce an account should use to vote with.

```js
    /**
     * @param account Account to query
     * @return nonce Nonce that shoul dbe used to vote with
     */
    function userNonces(
        address account
    ) external returns (uint256 nonce);
```

> function **lastUserProxyVoteBlock**()
Get the last block a user submitted a vote through a relayer.

```js 
    /**
     * @param account Account to check
     * @return blockNumber
     */
    function lastUserProxyVoteBlock(
        address account
    ) external returns (uint256 blockNumber);
```

> function **proxySubmitters**()
Check if an account is currently configured as a relayer.

```js
    /**
     * @param account Account to check
     * @return allowed
     */
    function proxySubmitters(
        address account
    ) external returns (bool allowed);
```

> function **getVotingTokens**()
Get the tokens that are currently used to calculate voting power.

```js
    /**
     * @return tokens
     */
    function getVotingTokens() external view returns (address[] memory tokens);
```

> function **vote**()
Allows backfilling of current balance.

```js
    /**
     * @param userVotePayload Users vote percent breakdown
     * @param signature Account signature
     */
    function vote(
        UserVotePayload calldata userVotePayload, 
        Signature memory signature
    ) external;
```

> function **voteDirect**()

```js
    function voteDirect(
        UserVotePayload memory userVotePayload
    ) external;
```

> function **updateUserVoteTotals**()
Updates the users and system aggregation based on their current balances.
Dev Should call back to BalanceTracker to pull that accounts current balance.

```js
    /**
     * @param accounts Accounts that just had their balance updated
     */
    function updateUserVoteTotals(address[] memory accounts) external;
```

> function **setBalanceTrackerAddress**()
Set the contract that should be used to lookup user balances.

```js
    /**
     * @param contractAddress Address of the contract
     */
    function setBalanceTrackerAddress(address contractAddress) external;
```

> function **setProxySubmitters**()
Toggle the accounts that are currently used to relay votes and thus subject to rate limits.

```js
    /**
     * @param submitters Relayer account array
     * @param allowed Add or remove the account
     */
    function setProxySubmitters(
        address[] calldata submitters, 
        bool allowed
    ) external;
```

> function **getReactorKeys**()
Get the reactors we are currently accepting votes for.

```js
    /**
     * @return reactorKeys Reactor keys we are currently accepting
     */
    function getReactorKeys() external view returns (bytes32[] memory reactorKeys);
```

> function **setReactorKeys**()

Set the reactors that we are currently accepting votes for.
dev Only current reactor keys will be returned from getSystemVotes().

```js
    /**
     * @param reactorKeys Array for token+key where token is the underlying ERC20 for the reactor and key is asset-default|exchange
     * @param allowed Add or remove the keys from use
     */
    function setReactorKeys(
        VotingLocation[] memory reactorKeys, 
        bool allowed
    ) external;
```

> function **getUserVotes**()
Current votes for the account.

```js
    /**
     * @param account Account to get votes for
     * @return Votes for the current account
     */
    function getUserVotes(
        address account
    ) external view returns (UserVotes memory);
```

> function **getSystemVotes**()
Current total votes for the system.

```js
    /**
     * @return systemVotes
     */
    function getSystemVotes() external view returns (SystemVotes memory systemVotes);
```

> function **getMaxVoteBalance**()
Get the current voting power for an account.

```js
    /**
     * @param account Account to check
     * @return Current voting power
     */
    function getMaxVoteBalance(
        address account
    ) external view returns (uint256);
```

> function **getVotingPower**()
Given a set of token balances, determine the voting power given current multipliers.

```js
    /**
     * @param balances Token+Amount to use for calculating votes
     * @return votes Voting power
     */
    function getVotingPower(
        TokenBalance[] memory balances
    ) external view returns (uint256 votes);
```

> function **setVoteMultiplers**()
Set the voting power tokens get.

```js
    /**
     * @param multipliers Token and multipliers to set. Multipliers should have 18 precision
     */
    function setVoteMultiplers(VoteTokenMultipler[] memory multipliers) external;
```

> function **setProxyRateLimit**()
Set the rate limit for using the proxy submission route

```js
    /**
     * @param voteEveryBlockLimit Minimum block gap between proxy submissions
     */
    function setProxyRateLimit(uint256 voteEveryBlockLimit) external;
```

> function **getSettings**()
Returns general settings and current system vote details.

```js
    function getSettings() external view returns (VoteTrackSettings memory settings);
```