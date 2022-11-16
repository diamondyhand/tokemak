# 🚩 AirdropPush

## Main Action 🔧

> function **distribute**()

This Contract distribute the amount(any ERC20 airdrop) to investors.
```js
    /**
     * @notice Used to distribute preToke to seed investors.  Can be used for any ERC20 airdrop
     * @param token IERC20 interface connected to distrubuted token contract
     * @param accounts Account addresses to distribute tokens to
     * @param amounts Amounts to be sent to corresponding addresses
     */
    function distribute(
        IERC20 token,
        address[] calldata accounts,
        uint256[] calldata amounts
    )
```