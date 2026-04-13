# Moonwell Contract Reference

## Deployments

### Base (Chain ID: 8453)

| Contract | Address |
|---|---|
| Comptroller | `0xfBb21d0380beE3312B33c4353c8936a0F13EF26C` |
| MultiRewardDistributor | `0xe9005b078701e2A0948D2EaC43010D35870Ad9d2` |
| mUSDC | `0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22` |
| mWETH | `0x628ff693426583D9a7FB391E54366292F509D457` |
| mCbETH | `0x3bf93770f2d4a794c3d9EBEfBAeBAE2a8f09A5E5` |
| mWstETH | `0x627Fe393Bc6EdDA28e99AE648fD6fF362514304b` |
| mCbBTC | `0xF877ACaFA28c19b96727966690b2f44d35aD5976` |
| mDAI | `0x73b06D8d18De422E269645eaCe15400DE7462417` |
| mAERO | `0x73902f619CEB9B31FD8EFecf435CbDf89E369Ba6` |

### Optimism (Chain ID: 10)

| Contract | Address |
|---|---|
| Comptroller | `0xCa889f40aae37FFf165BccF69aeF1E82b5C511B9` |
| MultiRewardDistributor | `0xF9524bfa18C19C3E605FbfE8DFd05C6e967574Aa` |

mToken addresses on Optimism are auto-resolved via `Comptroller.getAllMarkets()`.

## Full Contract Repository

All contract addresses are maintained per-chain in JSON:
https://github.com/moonwell-fi/moonwell-contracts-v2/tree/main/chains

## ABIs

### mToken ABI (key functions)

```json
[
  {"name":"mint","type":"function","stateMutability":"nonpayable","inputs":[{"name":"mintAmount","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},
  {"name":"redeemUnderlying","type":"function","stateMutability":"nonpayable","inputs":[{"name":"redeemAmount","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},
  {"name":"borrow","type":"function","stateMutability":"nonpayable","inputs":[{"name":"borrowAmount","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},
  {"name":"repayBorrow","type":"function","stateMutability":"nonpayable","inputs":[{"name":"repayAmount","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},
  {"name":"underlying","type":"function","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"address"}]},
  {"name":"getAccountSnapshot","type":"function","stateMutability":"view","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}]}
]
```

### Comptroller ABI (key functions)

```json
[
  {"name":"getAllMarkets","type":"function","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"address[]"}]},
  {"name":"enterMarkets","type":"function","stateMutability":"nonpayable","inputs":[{"name":"mTokens","type":"address[]"}],"outputs":[{"name":"","type":"uint256[]"}]},
  {"name":"checkMembership","type":"function","stateMutability":"view","inputs":[{"name":"account","type":"address"},{"name":"mToken","type":"address"}],"outputs":[{"name":"","type":"bool"}]},
  {"name":"getAssetsIn","type":"function","stateMutability":"view","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"address[]"}]}
]
```

### ERC-20 ABI (approval)

```json
[
  {"name":"approve","type":"function","stateMutability":"nonpayable","inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},
  {"name":"allowance","type":"function","stateMutability":"view","inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"outputs":[{"name":"","type":"uint256"}]}
]
```
