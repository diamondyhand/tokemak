# 🚩 Manager

Controls the transition and execution of liquidity deployment cycles.
Accepts instructions that can move assets from the Pools to the Exchanges and back.
Can also move assets to the treasury when appropriate.

## Main Action 🔧

> function **registerController**()
Registers controller

```js
    /**
     * @param id Bytes32 id of controller
     * @param controller Address of controller
     */
    function registerController(
        bytes32 id, 
        address controller
    )
```

> function **registerPool**()
Registers controller

```js
    /**
     * @param pool Address of pool
     */
    function registerPool(
        address pool
    )
```

> function **unRegisterController**()
Unregisters controller

```js
    /**
     * @param id Bytes32 controller id
     */
    function unRegisterController(
        byte32 id
    )
```

> function **unRegisterPool**()
Unregisters pool.

```js
    /**
     * @param pool Address of pool
     */
    function unRegisterPool(
        address pool
    )
```

> function **getPools**()
Gets addresses of all pools registered.

```js
    /**
     * @return Memory array of pool addresses
     */
    function getPools() external view returns(address[] memory);
```

> function **getControllers**()
Gets ids of all controllers registered.

```js
    /**
     * @return Memory array of Bytes32 controller ids
     */
    function getControllers() external view returns (bytes32[] memory);
```

> function **setCycleDuration**()
Allows for owner to set cycle duration.

```js
    /**
     * @param duration Block durtation of cycle
     */
    function setCycleDuration(uint256 duration) external;
```

> function **startCycleRollover**()
Starts cycle rollover.
Sets rolloverStarted state boolean to true.

> function **executeMaintenance**()
Allows for controller commands to be executed midcycle.

```js
    /**
     * @param params Contains data for controllers and params
     */
    function executeMaintenance(MaintenanceExecution calldata params) external;
```

> function **executeRollover**()
Allows for withdrawals and deposits for pools along with liq deployment.

```js
    /**
     * @param params Contains various data for executing against pools and controllers
     */
    function executeRollover(RolloverExecution calldata params) external;
```

> function **completeRollover**()
Completes cycle rollover, publishes rewards hash to ipfs. 
```js
    /**
     * @param param rewardsIpfsHash rewards hash uploaded to ipfs
     */
    function completeRollover(string calldata rewardsIpfsHash) external;
```

> function **cycleRewardsHashes**()
Gets reward hash by cycle index.

```js
    /**
     * @param index Cycle index to retrieve rewards hash
     * @return String memory hash
     */
    function cycleRewardsHashes(uint256 index) external view returns (string memory);
```

> function **getCurrentCycle**()
Gets current starting block.

```js
    /**
     * @return uint256 with block number
     */
    function getCurrentCycle() external view returns (uint256);
```

> function **getCurrentCycleIndex**()
Gets current cycle index.
```js
    /**
     * @return uint256 in block of cycle duration
     */
    function getCurrentCycleIndex() external view returns (uint256);
```

> function **getCycleDuration**()
Gets current cycle duration.

```js
    /**
     * @return uint256 in block of cycle duration
     */
    function getCycleDuration() external view returns (uint256);
```

> function **getRolloverStatus**()
Gets cycle rollover status, true for rolling false for not.

```js
    /**
     * @return Bool representing whether cycle is rolling over or not
     */
    function getRolloverStatus() external view returns (bool);
```

> function **setNextCycleStartTime**()
Sets next cycle start time manually.

```js
    /**
     * @param nextCycleStartTime uint256 that represents start of next cycle
     */
    function setNextCycleStartTime(uint256 nextCycleStartTime) external;
```

> function **sweep**()
Sweeps amanager contract for any leftover funds.

```js
    /**
     * @param addresses array of addresses of pools to sweep funds into
     */
    function sweep(address[] calldata addresses) external;
```

> function **setupRole**()
Sweeps amanager contract for any leftover funds.

```js
    /**
     * @param role keccak256 of the role keccak256("MY_ROLE");
     */
    function setupRole(bytes32 role) external;
```