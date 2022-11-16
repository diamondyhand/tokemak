# 🚩 Rewards

Tracks various configurations related to rewards Reactors, pools, base reward amounts, contracts query, etc Any off-chain process should use this as its source of truth for configuration.

## Main Action 🔧

> function **registerExcludePools**()
Register the pools to exclude from the reward calculation.

```js
    function registerExcludePools(address[] calldata pools) external;
```

> function **unregisterExcludePools**()
Unregister the pools to exclude from the reward calculation.

```js
    function unregisterExcludePools(address[] calldata pools) external;
```

> function **getExcludePools**()
Check the amount an account has already claimed.

```js
    /**
     * @return pools
     */
    function getExcludePools() external view returns (address[] memory pools);
```
