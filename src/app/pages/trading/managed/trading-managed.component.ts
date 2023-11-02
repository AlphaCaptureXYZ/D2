import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EventService } from 'src/app/services/event.service';

import TradingManagedBinanceFormComponent from 'src/app/brokerages/binance/trading/managed/trading-managed-form.component';

import TradingManagedIGFormComponent from 'src/app/brokerages/ig/trading/managed/trading-managed-form.component';


@Component({
    selector: 'app-trading-managed',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        TradingManagedBinanceFormComponent,
        TradingManagedIGFormComponent,
    ],
    templateUrl: './trading-managed.component.html',
    styleUrls: ['./trading-managed.component.scss']
})
export default class TradingManagedComponent {

    currentOption: string;
    provider: string;

    constructor(
        private eventService: EventService,
    ) {
        this.currentOption = 'trading-managed';
        this.provider = null as any;
    }


    async orderSizeCalculation(
        accountBalanceInBase: number,
        accountLeverage: number,
        defaultOrderSizeAsPercent: number,
        maximumPositionSizeAsPercent: number,
        existingPositionValueInBase: number,
        getRatesWithBase: any) {

        let data = {
            account: {
                balance: 0,
                leverage: 1,
            },
            position: {
                valueInBase: 0,
                currentPortfolioAllocation: 0,
            },
            order: {
                valueInBase: 0,
                quantity: 0,
                calculation: {
                    defaultOrderValueInBase: 0,
                    defaultOrderSizeAsPercent: 0,
                    maximumPositionValueInBase: 0,
                    maximumPositionSizeAsPercent: 0,
                    exceedsMaximum: false,
                }
            }
        }

        try {

            let calculatedOrderValueInBase = 0;
            let remainingPositionValueInBase = 0;
            let currentPortfolioAllocation = 0;
            let exceedsMaximum = false;

            // we'll do a very simple calc to start i.e. new order and then I'll add the rest for adjust/close etc

            // account balance in a single base currency
            // the leveraged balance is the maximum value the portfolio should be at
            const leveragedBalanceInBase = accountBalanceInBase * accountLeverage;

            // what a normal trade value should be
            const defaultOrderValueInBase = defaultOrderSizeAsPercent * leveragedBalanceInBase;
            // this becomes our default order value
            calculatedOrderValueInBase = defaultOrderValueInBase;

            // The existing position 
            const maximumPositionValueInBase = maximumPositionSizeAsPercent * leveragedBalanceInBase;

            // the current portfolio percentge
            currentPortfolioAllocation = (existingPositionValueInBase / leveragedBalanceInBase) * 100;

            // if the current asset value exceeds the maximum, then the 
            if (existingPositionValueInBase > maximumPositionValueInBase) {
                calculatedOrderValueInBase = 0;
                exceedsMaximum = true;
            } else {

                // how much extra value can we buy
                remainingPositionValueInBase = maximumPositionValueInBase - existingPositionValueInBase;

                if (calculatedOrderValueInBase > remainingPositionValueInBase) {
                    calculatedOrderValueInBase = remainingPositionValueInBase;
                } else {
                    // there's enough value for the default order
                }

            }

            // now we need to convert the value in base back to a qty that we can use

            // we'll need to the fx rates from our prices

            data = {
                account: {
                    balance: accountBalanceInBase,
                    leverage: accountLeverage,
                },
                position: {
                    valueInBase: existingPositionValueInBase,
                    currentPortfolioAllocation,
                },
                order: {
                    valueInBase: calculatedOrderValueInBase,
                    quantity: 0,
                    calculation: {
                        defaultOrderValueInBase,
                        defaultOrderSizeAsPercent,
                        maximumPositionValueInBase,
                        maximumPositionSizeAsPercent,
                        exceedsMaximum,
                    }
                }
            }

            return data;

        } catch (err: any) {
            console.log('orderSizeCalculation (error)', err?.message);
            return data;
        }
    }

    selectFormToShow(provider: string) {
        this.provider = provider;
    }

}