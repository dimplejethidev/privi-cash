import fs from 'fs';
//@ts-ignore
import zipper from 'zip-local';

export function saveZip(fileName: string) {
  try {
    zipper.sync.zip(`${fileName}`).compress().save(`${fileName}.zip`);

    fs.unlinkSync(fileName);
    return true;
  } catch (err: any) {
    console.log('on save error', fileName, err.message);
    return false;
  }
}
