import { useReadContracts } from 'wagmi'
import { vaultAbi } from '../vaultAbi'

const erc20SymbolAbi = [
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const

/**
 * Returns the vault share symbol (e.g. "sfJDOG") and the underlying asset symbol (e.g. "JDOG").
 * Falls back to '…' while loading.
 */
export function useVaultTokens(vaultAddress: `0x${string}`) {
  // Step 1: read vault symbol + asset address
  const { data: vaultData } = useReadContracts({
    contracts: [
      { address: vaultAddress, abi: vaultAbi, functionName: 'symbol' },
      { address: vaultAddress, abi: vaultAbi, functionName: 'asset' },
    ],
  })

  const vaultSymbol = (vaultData?.[0]?.result as string | undefined) ?? '…'
  const assetAddr   = vaultData?.[1]?.result as `0x${string}` | undefined

  // Step 2: read asset symbol once we have the address
  const { data: assetData } = useReadContracts({
    contracts: assetAddr
      ? [{ address: assetAddr, abi: erc20SymbolAbi, functionName: 'symbol' }]
      : [],
    query: { enabled: !!assetAddr },
  })

  const assetSymbol = (assetData?.[0]?.result as string | undefined) ?? '…'

  return { vaultSymbol, assetSymbol, assetAddr }
}
