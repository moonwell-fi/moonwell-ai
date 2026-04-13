# Moonwell Protocol Guide

Moonwell is a Compound v2 fork deployed on Base (8453) and Optimism (10). It provides permissionless lending and borrowing of ERC-20 tokens.

## Core Contracts

### mTokens (Market Tokens)
Each supported asset has a corresponding mToken contract (e.g., USDC → mUSDC). mTokens are ERC-20 tokens that represent a deposit and accrue interest via an increasing exchange rate.

Key functions:
- `mint(uint256 mintAmount) → uint256` — Deposit underlying, receive mTokens
- `redeemUnderlying(uint256 redeemAmount) → uint256` — Withdraw exact underlying amount
- `borrow(uint256 borrowAmount) → uint256` — Borrow underlying tokens
- `repayBorrow(uint256 repayAmount) → uint256` — Repay borrowed tokens
- `getAccountSnapshot(address) → (uint256 error, uint256 mTokenBalance, uint256 borrowBalance, uint256 exchangeRate)` — Account state
- `exchangeRateCurrent() → uint256` — Current mToken → underlying rate
- `supplyRatePerTimestamp() → uint256` — Per-second supply rate
- `borrowRatePerTimestamp() → uint256` — Per-second borrow rate

Return value of 0 = success. Non-zero = error code (Compound v2 convention).

### Comptroller
Manages market listing, collateral factors, and account liquidity.

Key functions:
- `getAllMarkets() → address[]` — List all mToken addresses
- `enterMarkets(address[] mTokens) → uint256[]` — Enable mTokens as collateral
- `checkMembership(address account, address mToken) → bool` — Check if account has entered market
- `getAssetsIn(address account) → address[]` — List markets account has entered
- `markets(address) → (bool isListed, uint256 collateralFactorMantissa)` — Market params
- `oracle() → address` — Price oracle contract

### Oracle
Returns prices scaled by `10^(36 - underlyingDecimals)`.

- `getUnderlyingPrice(address mToken) → uint256` — Price in USD mantissa

## Exchange Rate Math

```
underlyingBalance = mTokenBalance * exchangeRate / 1e18
```

The exchange rate starts at a fixed value and increases over time as interest accrues. This means holding mTokens passively earns interest.

## APY Calculation

```
secondsPerYear = 365.25 * 24 * 3600  // 31,557,600
APY = ratePerTimestamp * secondsPerYear / 1e18 * 100
```

## Account Liquidity

Account liquidity = sum(supplyUSD * collateralFactor) - sum(borrowUSD)

If liquidity goes negative, the account becomes liquidatable. Health factor = collateral / borrows; below 1.0 triggers liquidation.

## Rewards

Moonwell distributes WELL tokens to suppliers and borrowers via the `MultiRewardDistributor` contract. The SDK's `getUserRewards()` retrieves pending rewards per market.
