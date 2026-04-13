# Moonwell Safety Patterns

## WETH Edge Cases

Moonwell's mWETH on some chains auto-unwraps to native ETH on `borrow` and `redeemUnderlying` (withdraw). Conversely, `supply` and `repayBorrow` expect ERC-20 WETH, not native ETH.

**Implications:**
- When borrowing WETH, the user receives native ETH, not WETH
- When withdrawing WETH, the user receives native ETH, not WETH
- When supplying, the caller must wrap ETH → WETH before calling `mint`
- When repaying, the caller must wrap ETH → WETH before calling `repayBorrow`

The CLI warns when WETH operations are detected.

## enterMarkets Requirement

Supplying tokens does NOT automatically enable them as collateral. Users must explicitly call `Comptroller.enterMarkets([mToken])` to:
- Use supplied assets as collateral for borrowing
- Enable the asset to count toward account liquidity

The CLI supply command automatically includes an `enterMarkets` step if the user hasn't already entered the market.

## Collateral Factors and Liquidation

Each market has a `collateralFactor` (0 to 1) that determines borrowing power:
- USDC: typically 0.88 (88% of supplied value counts as collateral)
- ETH: typically 0.84
- Volatile assets: lower factors

**Health Factor** = sum(supplyUSD * collateralFactor) / sum(borrowUSD)
- Above 1.5: healthy
- 1.1 to 1.5: caution zone
- Below 1.1: high liquidation risk
- Below 1.0: liquidatable

## Compound v2 Error Codes

mToken functions return `uint256` where 0 = success. Non-zero values indicate business logic errors (insufficient balance, market not entered, etc.). These do NOT revert — they return error codes.

Common error codes:
- `3` (COMPTROLLER_REJECTION) — insufficient collateral or market not entered
- `9` (MATH_ERROR) — arithmetic overflow/underflow
- `13` (TOKEN_INSUFFICIENT_CASH) — market doesn't have enough liquidity
- `14` (TOKEN_TRANSFER_IN_FAILED) — ERC-20 transferFrom failed (check approval)

## Approval Best Practices

The CLI uses bounded approvals (exact amount needed) rather than max approvals. This limits exposure if the mToken contract is compromised. Use `--pool-address` to override mToken resolution if auto-resolution fails.

## No Alternate Recipients

Compound v2 operations (`mint`, `borrow`, `repayBorrow`, `redeemUnderlying`) operate on `msg.sender` only. There is no `onBehalfOf` parameter. The `--from` address must be the transaction signer.
