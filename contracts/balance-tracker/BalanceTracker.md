# 🚩 BalanceTracker

## Description: 
_delegate function permits delegation of balances to account whos balance has not been properly initialized.

### Note:
The code has been adjusted so that the _delegate function also overwrites the token entry of the newDelegateBal, ensuring that it will always be non-zero.

## Main Action 🔧

> function **getBalance**()
Users get balances of their own tokens . If the user has delegated, balances of  tokens is 0.
```js
    function getBalance(
        address account,
        address[] calldata tokens
    )
```

> function **getActualBalance**()
Users get real balances of their own tokens.
```js
    function getActualBalance(
        address account,
        address[] calldata tokens
    )
```

> function **setBalance**()
Admin can set balances of tokens. In this time, stateSync updates balances on an ongoing basis, whereas setBalance is only allowed to update balances that have not been set before.
```js
    function setBalance(
        SetTokenBalance[] calldata balances
    )
```

> function **getSupportedTokens**()
get SupportedTokens.
```js
    function getSupportedTokens()
```

> function **addSupportedTokens**()
add SupportedTokens.
```js
    function addSupportedTokens(
        address[] calldata tokensToSupport
    )
```

> function **removeSupportedTokens**()
remove SupportedTokens.
```js
    function removeSupportedTokens(
        address[] calldata tokensToSupport
    )
```