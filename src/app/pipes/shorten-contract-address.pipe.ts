import { Pipe, PipeTransform } from '@angular/core';
import { shortenAddress } from '../helpers/helpers';

@Pipe({
    name: 'shortenContractAddress',
    standalone: true,
    pure: true,
})
export class ShortenContractAddress implements PipeTransform {
    transform(contractAddress: string): any {
        return shortenAddress(contractAddress);
    }
}
