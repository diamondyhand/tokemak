# 🚩 Rewards

Validates and distributes TOKE rewards based on the signed and submitted payloads.

## Main Action 🔧

> function **tokeToken**()
Get the underlying token rewards are paid in.

```js
    /**
     * @return Token address
     */
    function tokeToken() view external;
```

> function **rewardsSigner**()
Get the current payload signer.

```js
    /**
     * @return Signer address
     */
    function rewardsSigner() external view returns (address);
```

> function **claimedAmounts**()
Check the amount an account has already claimed.

```js
    /**
     * @param account Account to check
     * @return Amount already claimed
     */
    function claimedAmounts(address account) external view returns (uint256);
```

> function **getClaimableAmount**()
Get the amount that is claimable based on the provided payload.
```js
    /**
     * @param recipient Published rewards payload
     * @return Amount claimable if the payload is signed
     */
    function getClaimableAmount(Recipient calldata recipient) external view returns (uint256);
```

> function **setSigner**()
Change the signer used to validate payloads.

```js
    /**
     * @param newSigner The new address that will be signing rewards payloads
     */
    function setSigner(address newSigner) external;
```

> function **claim**()
Claim your rewards.

```js
    /**
     * @param recipient Published rewards payload
     * @param v v component of the payload signature
     * @param r r component of the payload signature
     * @param s s component of the payload signature
     */
    function claim(
        Recipient calldata recipient,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
```