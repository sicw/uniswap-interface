import { Currency, CurrencyAmount, Pair, Token, Trade } from '@sicwen/uniswap-sdk-bsctestnet'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { maxHopsFor } from '../utils/maxHopsFor'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useActiveWeb3React } from './index'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useActiveWeb3React()
  /**
   *  根据chainId获取base token, base Token主要是用来作为中间token的, 一般会选择交易池比较大的token 例如: dai usdt usdc weth
   */
  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]
  /**
   * allPairCombinations类型是 [[Token1,Token2],[Token3,Token4],[Token5,Token6]]
   * 以要交换的TokenA,TokenB,TokenC,TokenD为例
   */
  const allPairCombinations: [Token | undefined, Token | undefined][] = useMemo(
    () => [
      // the direct pair
      // [A,D]
      [tokenA, tokenB],
      // token A against all bases
      // map中的base是函数参数:后的是函数返回类型[Token,Token] => 函数体 这里注意bases.map返回的是[[Token1,Token2]]这种类型 所以前面加了...进行展开变成[Token1,Token2],[Token3,Token4]
      // [A,B][A,C]
      ...bases.map((base): [Token | undefined, Token | undefined] => [tokenA, base]),
      // token B against all bases
      // [D,B][D,C]
      ...bases.map((base): [Token | undefined, Token | undefined] => [tokenB, base]),
      // each base against all bases
      // bases是flatMap的第一个参数, (base)是函数参数:后的是返回类型 bases.map返回来的是[[Token1,Token2],[Token3,Token4]]
      // 参数base是bases传递过去的有两个值TokenB,TokenC. otherBase也是遍历bases有两个值TokenB,TokenC. 所以正交计算出来后有4对[B,B][B,C][C,B][C,C]
      ...flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase]))
    ],
    [tokenA, tokenB, bases]
  )

  // 根据查到的[Token1,Token2]token对, 查询合约获取对应的pair信息
  const allPairs = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      const maxHops = maxHopsFor(currencyAmountIn.currency, currencyOut)
      return (
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops, maxNumResults: 1 })[0] ?? null
      )
    }
    return null
  }, [allowedPairs, currencyAmountIn, currencyOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      const maxHops = maxHopsFor(currencyIn, currencyAmountOut.currency)
      return (
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops, maxNumResults: 1 })[0] ?? null
      )
    }
    return null
  }, [allowedPairs, currencyIn, currencyAmountOut])
}
