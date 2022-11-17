# 🚩 ZeroExTradeWallet

0x trade wallet used to hold funds and fullfil orders submitted by Pricers.

## Main Action 🔧

> function **getQueuedTransfer**()
Register with 0x an address that is allowed to sign on behalf of this contract.

```js
    /**
     * @param signer EOA that is signing RFQ orders
     */
    function registerAllowedOrderSigner(
        address signer, 
        bool allowed
    ) external;
```

> function **deposit**()
Add the supplied amounts to the wallet to fullfill order with.

```js
    function deposit(
        address[] calldata tokens, 
        uint256[] calldata amounts
    ) external;    
```

> function **withdraw**()
Withdraw assets from the wallet.

```js
    function withdraw(
        address[] calldata tokens, 
        uint256[] calldata amounts
    ) external;
```

> function **whitelistTokens**()
add whitelistTokens.

```js
    function whitelistTokens(
        address[] calldata tokensToAdd
    ) external
```

> function **removeWhitelistedTokens**()
remove whiteListTokens.
```js
    function removeWhitelistedTokens(
        address[] calldata tokensToRemove
    ) external
```