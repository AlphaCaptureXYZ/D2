import { IPaging } from "../interfaces/interfaces";

export const isNullOrUndefined = (value: any) => {
  const checkValue = [
    undefined,
    null,
    'undefined',
    'UNDEFINED',
    'Undefined',
    'null',
    'NULL',
    'Null',
    'NONE',
    'None',
    'none',
  ]?.includes(value)
    ? undefined
    : value;
  const check = checkValue === undefined || null ? true : false;
  return check;
}

export const getBoolean = (value: any): boolean => {
  const data = {
    true: true,
    false: false,
    1: true,
    0: false,
    undefined: false,
    null: false,
  };
  const response = (data as any)[value];
  return response;
}

export function shortenAddress(address: string) {
  return `${address?.slice(0, 5)}...${address?.slice(-4)}`;
}

export const limitTextLengthFn = (value: string, limit: string) => {
  const size = Number(limit);

  if (value?.length > Number(limit)) {
    return value?.substring(0, size) + '...';
  }

  return value;
}

export const isNullOrWhiteSpace = (value: any) => {
  const isNullOrUndefinedCheck = isNullOrUndefined(value);

  let check = isNullOrUndefinedCheck;

  if (!isNullOrUndefinedCheck) {
    const isWhiteSpaceCheck = value?.trim()?.toString()?.length <= 0;
    check = isWhiteSpaceCheck;
  }

  return check;
}

export const wait = (time = 1000): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      const interval = setInterval(() => {
        clearInterval(interval);
        resolve();
      }, time);
    } catch (err) {
      reject();
    }
  });
}

export const isObject = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export const prettyCode = (code: string) => {
  code = code.split('\n').map(line => line.slice(4)).join('\n');
  code = code.split('\n').slice(1, -1).join('\n');
  code = code.split('\n').map(line => line.slice(6)).join('\n');
  return '\n' + code + '\n' + '\n';
}

export const copyValue = (value: string) => {
  const command = 'copy';
  const tempElement = document.createElement('textarea');

  tempElement.style.position = 'fixed';
  tempElement.style.left = '0';
  tempElement.style.top = '0';
  tempElement.style.opacity = '0';
  tempElement.value = value;

  document.body.appendChild(tempElement);

  tempElement.focus();
  tempElement.select();
  // tslint:disable-next-line: deprecation
  document.execCommand(command);

  document.body.removeChild(tempElement);
};

export const loop = (
  next: () => Promise<void>,
  validator: () => Promise<boolean>,
  settings?: {
    loopTimeInMs: number
    limitTimeSecond: number
  },
  errorCallback?: (error: string) => Promise<void>,
) =>
  new Promise<void>(async (resolve, reject) => {
    try {
      // default settings
      if (!settings?.loopTimeInMs || settings?.loopTimeInMs <= 0) {
        //@ts-ignore
        settings.loopTimeInMs = 5000
      }

      if (!settings?.limitTimeSecond || settings?.limitTimeSecond <= 0) {
        //@ts-ignore
        settings.limitTimeSecond = 60
      }

      const loopTimeInMs: any = settings?.loopTimeInMs
      const limitTimeSecond: any = settings?.limitTimeSecond

      //@ts-ignore
      const loopTimeInMsToSecond = Math.floor((loopTimeInMs / 1000) % 60)

      // check
      //@ts-ignore
      if (loopTimeInMsToSecond >= limitTimeSecond) {
        throw new Error('The loop can not be greater than limit.')
      }

      const startDate = new Date()

      let interval: any = null

      interval = setInterval(async () => {
        try {
          const status = await validator()
          const endDate = new Date()
          const seconds =
            (endDate.getTime() - startDate.getTime()) / 1000

          // If we exceed the standby limit, we cut the process
          if (seconds >= limitTimeSecond && !status) {
            clearInterval(interval)

            if (errorCallback) {
              await errorCallback('Time limit exceeded')
            }

            throw new Error('Time limit exceeded')
          }

          // if validator is completed!
          if (status) {
            clearInterval(interval)
            interval = null
            await next()
            resolve()
          }
        } catch (err) {
          reject(err)
        }
      }, loopTimeInMs)
    } catch (err: any) {
      if (errorCallback) {
        await errorCallback(err?.message)
      }
      reject(err)
    }
  });

export const getDataWithPaging = <T>(params: IPaging<T>): IPaging<T> => {
  
  const array = params.data;
  const total = array.length;
  const { page, limit } = params.paging;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const data = array.slice(startIndex, endIndex);

  return {
    data,
    paging: {
      page,
      limit,
    },
    total,
  }
}

export function countDecimals(value: number): number {
	if(Math.floor(value) === value) return 0;
	return value.toString().split(".")[1].length || 0;	
}

export function longShort(value: number): string {
  let direction = 'long';

  if (value === 0) {
    direction = 'neutral';
  } else if (value < 0) {
    direction = 'short';
  }

  return direction;
}

/**
 * Adjusts a number to the specified digit.
 *
 * @param {"round" | "floor" | "ceil"} type The type of adjustment.
 * @param {number} value The number.
 * @param {number} exp The exponent (the 10 logarithm of the adjustment base).
 * @returns {number} The adjusted value.
 */
export function decimalAdjust(type: string, value: number, exp: number) {
  type = String(type);
  if (!["round", "floor", "ceil"].includes(type)) {
    throw new TypeError(
      "The type of decimal adjustment must be one of 'round', 'floor', or 'ceil'.",
    );
  }
  exp = Number(exp);
  value = Number(value);
  if (exp % 1 !== 0 || Number.isNaN(value)) {
    return NaN;
  } else if (exp === 0) {
    switch(type) {
      case 'round': 
        return Math.round(value);
      case 'floor': 
        return Math.floor(value);
      case 'ceil': 
        return Math.ceil(value);
    }
  }
  const [magnitude, exponent = 0] = value.toString().split("e");
  let adjustedValue = 0;
  // const adjustedValue = Math[type](`${magnitude}e${exponent - exp}`);

  switch(type) {
    case 'round': 
      adjustedValue = Math.round(Number(`${magnitude}e${Number(exponent) - exp}`));
      break;
    case 'floor': 
      adjustedValue = Math.floor(Number(`${magnitude}e${Number(exponent) - exp}`));
      break;
    case 'ceil': 
      adjustedValue = Math.ceil(Number(`${magnitude}e${Number(exponent) - exp}`));
      break;
}

  // Shift back
  const [newMagnitude, newExponent = 0] = adjustedValue.toString().split("e");
  return Number(`${newMagnitude}e${+newExponent + exp}`);
}
