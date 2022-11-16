# 🚩 Staking

Allows for the staking and vesting of TOKE for liquidity directors. Schedules can be added to enable various cliff+duration/interval unlock periods for vesting tokens.

## Main Action 🔧

> function **getQueuedTransfer**()
Get a queued higher level schedule transfers.

```js
    /**
     * @param fromAddress Account that initiated the transfer
     * @param fromScheduleId Schedule they are transferring out of
     * @return Details about the transfer
     */
    function getQueuedTransfer(address fromAddress, uint256 fromScheduleId)
        external
        view
        returns (QueuedTransfer memory);
```

> function **transferApprover**()
Get the current transfer approver.

```js
    /**
     * @return Transfer approver address
     */
    function transferApprover() external returns (address);
```

> function **permissionedDepositors**()
Allows for checking of user address in permissionedDepositors mapping.

```js
    /**
     * @param account Address of account being checked
     * @return Boolean, true if address exists in mapping
     */
    function permissionedDepositors(address account) external returns (bool);
```

> function **setUserSchedules**()
Allows owner to set a multitude of schedules that an address has access to.

```js
    /**
     * @param account User address
     * @param userSchedulesIdxs Array of schedule indexes
     */
    function setUserSchedules(address account, uint256[] calldata userSchedulesIdxs) external;
```

> function **addSchedule**()
Allows owner to add schedule.

```js
    /**
     * @param schedule A StakingSchedule struct that contains all info needed to make a schedule
     * @param notional Notional addrss for schedule, used to send balances to L2 for voting purposes
     */
    function addSchedule(StakingSchedule memory schedule, address notional) external;
```

> function **getSchedules**()
Gets all info on all schedules.

```js
    /**
     * @return retSchedules An array of StakingScheduleInfo struct
     */
    function getSchedules() external view returns (StakingScheduleInfo[] memory retSchedules);
```

> function **setPermissionedDepositor**()
Allows owner to set a permissioned depositor.

```js
    /**
     * @param account User address
     * @param canDeposit Boolean representing whether user can deposit
     */
    function setPermissionedDepositor(address account, bool canDeposit) external;
```

> function **getStakes**()
Allows a user to get the stakes of an account.

```js
    /**
     * @param account Address that is being checked for stakes
     * @return stakes StakingDetails array containing info about account's stakes
     */
    function getStakes(address account) external view returns (StakingDetails[] memory stakes);
```

> function **balanceOf**()
Gets total value staked for an address across all schedules.
```js
    /**
     * @param account Address for which total stake is being calculated
     * @return value uint256 total of account
     */
    function balanceOf(address account) external view returns (uint256 value);
```

> function **availableForWithdrawal**()
Returns amount available to withdraw for an account and schedule Index.
```js
    /**
     * @param account Address that is being checked for withdrawals
     * @param scheduleIndex Index of schedule that is being checked for withdrawals
     */
    function availableForWithdrawal(address account, uint256 scheduleIndex)
        external
        view
        returns (uint256);    
```

> function **unvested**()
Returns unvested amount for certain address and schedule index.

```js
    /**
     * @param account Address being checked for unvested amount
     * @param scheduleIndex Schedule index being checked for unvested amount
     * @return value Uint256 representing unvested amount
     */
    function unvested(address account, uint256 scheduleIndex) external view returns (uint256 value);
```

> function **vested**()
Returns vested amount for address and schedule index.

```js
    /**
     * @param account Address being checked for vested amount
     * @param scheduleIndex Schedule index being checked for vested amount
     * @return value Uint256 vested
     */
    function vested(address account, uint256 scheduleIndex) external view returns (uint256 value);
```

> function **deposit**()
Allows user to deposit token to specific vesting / staking schedule.

```js
    /**
     * @param amount Uint256 amount to be deposited
     * @param scheduleIndex Uint256 representing schedule to user
     */
    function deposit(uint256 amount, uint256 scheduleIndex) external;
```

> function **depositFor**()
Allows account to deposit on behalf of other account.

```js
    /**
     * @param account Account to be deposited for
     * @param amount Amount to be deposited
     * @param scheduleIndex Index of schedule to be used for deposit
     */
    function depositFor(
        address account,
        uint256 amount,
        uint256 scheduleIndex
    ) external;
```

> function **requestWithdrawal**()
User can request withdrawal from staking contract at end of cycle.
Performs checks to make sure amount <= amount available.

```js
    /**
     * @param amount Amount to withdraw
     * @param scheduleIdx Schedule index for withdrawal Request
     */
    function requestWithdrawal(uint256 amount, uint256 scheduleIdx) external;
```

> function **withdraw**()
Allows for withdrawal after successful withdraw request and proper amount of cycles passed.

```js
    /**
     * @param amount Amount to withdraw
     * @param scheduleIdx Schedule to withdraw from
     */
    function withdraw(uint256 amount, uint256 scheduleIdx) external;
```

> function **setScheduleStatus**()
Allows owner to set schedule to active or not.

```js
    /**
     * @param scheduleIndex Schedule index to set isActive boolean
     * @param activeBoolean Bool to set schedule active or not
     */
    function setScheduleStatus(uint256 scheduleIndex, bool activeBoolean) external;
```

> function **setScheduleHardStart**()
Allows owner to update schedule hard start.

```js
    /**
     * @param scheduleIdx Schedule index to update
     * @param hardStart new hardStart value
     */
    function setScheduleHardStart(uint256 scheduleIdx, uint256 hardStart) external;
```


> function **updateScheduleStart**()
Allows owner to update users schedules start.

```js
    /**
     * @param accounts Accounts to update
     * @param scheduleIdx Schedule index to update
     */
    function updateScheduleStart(address[] calldata accounts, uint256 scheduleIdx) external;
```

> function **slash**()
Used to slash user funds when needed. accounts and amounts arrays must be same length.
Only one scheduleIndex can be slashed at a time. Implementation must be restructed to owner account.

```js
    /**
     * @param accounts Array of accounts to slash
     * @param amounts Array of amounts that corresponds with accounts
     * @param scheduleIndex scheduleIndex of users that are being slashed
     */
    function slash(
        address[] calldata accounts,
        uint256[] calldata amounts,
        uint256 scheduleIndex
    ) external;    
```

> function **queueTransfer**()
Allows user to transfer stake to another address.

```js
    /**
     * @param scheduleFrom, schedule stake being transferred from
     * @param scheduleTo, schedule stake being transferred to
     * @param amount, Amount to be transferred to new address and schedule
     * @param to, Address to be transferred to
     */
    function queueTransfer(
        uint256 scheduleFrom,
        uint256 scheduleTo,
        uint256 amount,
        address to
    ) external;
```

> function **removeQueuedTransfer**()
Allows user to remove queued transfer.

```js
    /**
     * @param scheduleIdxFrom scheduleIdx being transferred from
     */
    function removeQueuedTransfer(
        uint256 scheduleIdxFrom
    ) external;
```

> function **setNotionalAddresses**()
Set the address used to denote the token amount for a particular schedule.
Relates to the Balance Tracker tracking of tokens and balances. Each schedule is tracked separately.

```js
    function setNotionalAddresses(
        uint256[] calldata scheduleIdxArr, 
        address[] calldata addresses
    ) external;
```

> function **sweepToScheduleZero**()
For tokens in higher level schedules, move vested amounts to the default schedule.
Allows for full voting weight to be applied when tokens have vested.

```js
    /**
     * @param scheduleIdx Schedule to sweep tokens from
     * @param amount Amount to sweep to default schedule
     */
    function sweepToScheduleZero(uint256 scheduleIdx, uint256 amount) external;
```

> function **setTransferApprover**()
Set the approver for higher schedule transfers.

```js
    /**
     * @param approver New transfer approver
     */
    function setTransferApprover(address approver) external;
```

> function **withdraw**()
Withdraw from the default schedule. Must have a request in previously.

```js
    /**
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external;
```

> function **rejectQueuedTransfer**()
Allows transfeApprover to reject a submitted transfer.

```js
    /**
     * @param from address queued transfer is from
     * @param scheduleIdxFrom Schedule index of queued transfer
     */
    function rejectQueuedTransfer(address from, uint256 scheduleIdxFrom) external;
```

> function **approveQueuedTransfer**()
Approve a queued transfer from a higher level schedule.

```js
    /**
     * @param from address that queued the transfer
     * @param scheduleIdxFrom Schedule index of queued transfer
     * @param scheduleIdxTo Schedule index of destination
     * @param amount Amount being transferred
     * @param to Destination account
     */
    function approveQueuedTransfer(
        address from,
        uint256 scheduleIdxFrom,
        uint256 scheduleIdxTo,
        uint256 amount,
        address to
    ) external;
```