import { v4 } from '@ixily/activ-web';
import { CryptoIdeasModule } from '@ixily/activ-web/dist/src/modules/activ-v4';

export function isNullOrUndefined(value: any) {
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

const restoreImageByCID = async (cid: string) => {
  return CryptoIdeasModule?.restoreImage(cid);
};

export const displayImage = async (
  // simple string to know what process is calling this function (example: strategy, idea, etc)
  indicator: string,
  // the image object
  imgObj: v4.ITradeIdeaImage,
  // the default image to use if we can't find the image
  defaultImage?: string
) => {
  let check = false;

  let img;

  const displayImageErrorLog = (err: any) => {
    // console.log(`displayImage [${indicator}] (Error)`, err?.message);
  };

  try {
    if ((imgObj as any)?.startsWith('data:image')) {
      img = {
        type: 'b64',
        source: imgObj as string,
      };
      check = true;
    }
  } catch (err) {
    displayImageErrorLog(err);
  }

  try {
    if (!isNullOrUndefined(imgObj?.b64) && !check) {
      if (imgObj?.b64?.startsWith('data:image')) {
        img = {
          type: 'b64',
          source: imgObj.b64,
        };
        check = true;
      }
    }
  } catch (err) {
    displayImageErrorLog(err);
  }

  try {
    if (!isNullOrUndefined(imgObj?.url) && !check) {
      img = {
        type: 'url',
        source: imgObj.url,
      };
      check = true;
    }
  } catch (err) {
    displayImageErrorLog(err);
  }

  try {
    if (!isNullOrUndefined(imgObj?.cid) && !check) {
      const text = await restoreImageByCID(imgObj.cid as string);
      img = {
        type: 'b64',
        source: text,
      };
      check = true;
    }
  } catch (err) {
    displayImageErrorLog(err);
  }

  // console.log('');
  // console.log('==========================================');
  // console.log('displayImage (indicator)', indicator);
  // console.log('displayImage (imgObj)', imgObj);
  // console.log('displayImage (img)', img);
  // console.log('==========================================');
  // console.log('');

  return img;
};
