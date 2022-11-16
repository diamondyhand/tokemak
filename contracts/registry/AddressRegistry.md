# 🚩 Redeem

Approves max uint256 on creation for the toToken against the staking contract.

## Main Action 🔧

> function **addRegistrar**()
Allows address with REGISTERED_ROLE to add a registered address.

> function **removeRegistrar**()
Allows address with REGISTERED_ROLE to remove a registered address.

> function **addToRegistry**()
Allows array of addresses to be added to registry for certain index.

```js
    /**
     * @param _addresses calldata array of addresses to be added to registry.
     * @param _index AddressTypes enum of index to add addresses to.
     */
    function addToRegistry(address[] calldata _addresses, AddressTypes _index) external;
```

> function **removeFromRegistry**()
Allows array of addresses to be removed from registry for certain index

```js
    /**
     * @param _addresses calldata array of addresses to be removed from registry
     * @param _index AddressTypes enum of index to remove addresses from
     */
    function removeFromRegistry(address[] calldata _addresses, AddressTypes _index) external;
```

> function **getAddressForType**()
Allows array of all addresses for certain index to be returned.

```js
    /**
     * @param _index AddressTypes enum of index to be returned
     * @return address[] memory of addresses from index
     */
    function getAddressForType(AddressTypes _index) external view returns (address[] memory);
```

> function **checkAddress**()
Allows checking that one address exists in certain index.
```js
    /**
     * @param _addr address to be checked
     * @param _index AddressTypes index to check address against
     * @return bool tells whether address exists or not
     */    
    function checkAddress(address _addr, uint256 _index) external view returns (bool);
```

> function **weth**()
Returns weth address.

```js
    /**
     * @return address weth address
     */
    function weth() external view returns (address);
```