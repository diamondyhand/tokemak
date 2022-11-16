# 🚩 RewardHash

Tracks the IPFS hashes that are generated for rewards.

## Main Action 🔧

> function **setCycleHashes**()
Sets a new (claimable, cycle) hash tuple for the specified cycle.

```js
    /**
     * @param index Cycle index to set. If index >= LatestCycleIndex, CycleHashAdded is emitted
     * @param latestClaimableIpfsHash IPFS hash of last claimable cycle before/including this cycle
     * @param cycleIpfsHash IPFS hash of this cycle
     */
    function setCycleHashes(
        uint256 index,
        string calldata latestClaimableIpfsHash,
        string calldata cycleIpfsHash
    ) external;
```

> function **cycleHashes**()
Gets hashes for the specified cycle.

```js
    /**
     * @return latestClaimable lastest claimable hash for specified cycle, cycle latest hash (possibly non-claimable) for specified cycle
     */
    function cycleHashes(uint256 index)
        external
        view
        returns (string memory latestClaimable, string memory cycle);
```