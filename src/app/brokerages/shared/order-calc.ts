export interface IOrderCalc {
  asset: {
    ticker: string,
    name: string,
    price: {
      ask: number,
      bid: number,
    },
    minQty: number,
    fractional: boolean,
    decimals: number,
  },
  account: {
    balance: number,
    leverage: number,
    leverageBalance: number,
    currencySymbol: string,
  },
  existingPosition: {
    valueInBase: number,
    currentPortfolioAllocation: number,
    remainingValue: number,
  },
  portfolio: {
    net: Array<{
      ticker: string,
      size: number,
      direction: string,
      bid: number,
      offer: number,
      value: number,
    }>,
    raw: Array<{
      ticker: string,
      size: number,
      direction: string,
      bid: number,
      offer: number,
      value: number,
    }>
  },
  portfolioStats: {
    long: number,
    short: number,
    net: number,
    remaining: number,
  },
  order: {
    default: {
      value: number,
      valueWithConviction: number,
      portfolioAllocation: number,
    },
    settings: {
      conviction: number,
      maxPortfolioSize: number,
      maxPortfolioValue: number,
    },
    calc: {
      maxPortfolioValueExceeded: boolean,
      maxPortfolioValueExceededBy: number,
      overrideLimits: boolean,
      exceedsMinQty: boolean,
      maxPortfolioExposureExceeded: boolean,
      maxPortfolioExposureExceededBy: number,
    },
    potential: {
      direction: string,
      value: number,
      quantity: number,
      orderSizePercentage: number,
      portfolio: {
        value: number,
        allocation: number,
      },
      price: {
        value: number,
        type: string,
      }
    },
    final: {
      direction: string,
      value: number,
      quantity: {
        raw: number,
        rounded: number,
      },
      orderSizePercentage: number,
      portfolio: {
        value: number,
        allocation: number,
      },
      price: {
        value: number,
        type: string,
      }
    }
  }
}

export const defaultOrderCalc: IOrderCalc = {
  asset: {
    ticker: '',
    name: '',
    price: {
      ask: 0,
      bid: 0,
    },
    minQty: 1,
    fractional: false,
    decimals: 1,
  },
  account: {
    balance: 0,
    leverage: 1,
    leverageBalance: 0,
    currencySymbol: '$',
  },
  existingPosition: {
    valueInBase: 0,
    currentPortfolioAllocation: 0,
    remainingValue: 0,
  },
  portfolio: {
    net: [
      {
        ticker: '',
        size: 0,
        direction: '',
        bid: 0,
        offer: 0,
        value: 0,
      }
    ],
    raw: [
      {
        ticker: '',
        size: 0,
        direction: '',
        bid: 0,
        offer: 0,
        value: 0,
      }
    ]
  },
  portfolioStats: {
    long: 0,
    short: 0,
    net: 0,
    remaining: 0,
  },
  order: {
    default: {
      value: 0,
      valueWithConviction: 0,
      portfolioAllocation: 0,
    },
    settings: {
      conviction: 0,
      maxPortfolioSize: 1,
      maxPortfolioValue: 0,
    },
    calc: {
      maxPortfolioValueExceeded: false,
      maxPortfolioValueExceededBy: 0,
      overrideLimits: false,
      exceedsMinQty: true,
      maxPortfolioExposureExceeded: false,
      maxPortfolioExposureExceededBy: 0,
    },
    potential: {
      direction: '',
      value: 0,
      quantity: 0,
      orderSizePercentage: 0,
      portfolio: {
        value: 0,
        allocation: 0,
      },
      price: {
        value: 0,
        type: '',
      }
    },
    final: {
      direction: '',
      value: 0,
      quantity: {
        raw: 0,
        rounded: 0,
      },
      orderSizePercentage: 0,
      portfolio: {
        value: 0,
        allocation: 0,
      },
      price: {
        value: 0,
        type: '',
      }
    }
  }
}