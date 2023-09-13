import { Injectable, inject, } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, retry, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

const apiURL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  getAccountInfo() {
    return this.httpClient
      .get<any>(`${apiURL}/v1/ping`,
        {
          headers: {}
        })
      .pipe(
        shareReplay(1), retry(3),
      ).pipe(map((res: any) => {
        return res?.data || null;
      }));
  }

}
