# 🚩 DelegateFunction

Manages the state of an accounts delegation settings.
Allows for various methods of validation as well as enabling different system functions to be delegated to different accounts.

## Main Action 🔧

> function **contractWalletNonces**()
Get the current nonce a contract wallet should use.

```js
    /**
     * @param account Account to query
     * @return nonce Nonce that should be used for next call.
     */
    function contractWalletNonces(
        address account
    )
```

> function **getDelegations**()

Get an accounts current delegations.
These may be in a pending state

```js
    /**
     * @param from Account that is the delegation functions away
     * @return map Delegation info
     */
    function getDelegations(
        address from, 
        bytes32 functionId        
    )
```

> function **getDelegation**()
Get an accounts delegation of a specific function.
These may be in a pending state.

```js
    /**
     * @param from Account that is the delegation functions away
     * @return map Delegation info
     */
    function getDelegation(
        address from, 
        bytes32 functionId
    )
```

> function **delegate**()
Initiate delegation of one or more system functions to different account(s).

```js
    /**
     * @param sets Delegation instructions for the contract to initiate
     */
    function delegate(
        DelegateMap[] memory sets        
    )
```

> function **delegateWithEIP1271**()
Initiate delegation on behalf of a contract that supports ERC1271.

```js
    /**
     * @param contractAddress Address of the ERC1271 contract used to verify the given signature
     * @param delegatePayload Sets of DelegateMap objects
     * @param signature Signature data
     * @param signatureType Type of signature used (EIP712|EthSign)
     */
    function delegateWithEIP1271(
        address contractAddress,
        DelegatePayload memory delegatePayload,
        bytes memory signature,
        SignatureType signatureType
    ) external;
```

> function **acceptDelegation**()
Accept one or more delegations from another account.

```js
    /**
     * @param incoming Delegation details being accepted
     */
    function acceptDelegation(
        DelegatedTo[] calldata incoming
    ) external; 
```

> function **cancelPendingDelegation**()
Cancel one or more delegations you have setup on behalf of a contract that supported EIP1271, but that has not yet been accepted.

```js
    /**
     * @param contractAddress Address of the ERC1271 contract used to verify the given signature
     * @param functionsListPayload Sets of FunctionListPayload objects ({sets: bytes32[]})
     * @param signature Signature data
     * @param signatureType Type of signature used (EIP712|EthSign)
     */
    function cancelPendingDelegationWithEIP1271(
        address contractAddress,
        FunctionsListPayload calldata functionsListPayload,
        bytes memory signature,
        SignatureType signatureType
    ) external;
```

> function **setAllowedFunctions**()

```js
    /**
     * @param functions New system function ids 
     */
    function setAllowedFunctions(
        AllowedFunctionSet[] calldata functions
    )
```
