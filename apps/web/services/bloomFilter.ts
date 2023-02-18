//@ts-ignore
import BloomFilter from 'bloomfilter.js';
import { downloadFile } from 'utils/snark';

class BloomService {
  commitment: string;
  bloomService: any;
  fileFolder: string;
  fileName: string;

  constructor({ commitment, fileName, fileFolder }: any) {
    this.fileFolder = fileFolder;
    this.commitment = commitment;
    this.fileName = `${fileFolder}/${fileName}`;

    // this.idb = window.$nuxt.$indexedDB(netId);
  }

  async downloadBloom() {
    const cachedBloom = await downloadFile({
      name: this.fileName,
      contentType: 'string',
    });

    if (!cachedBloom) {
      throw new Error('Cant download file');
    }

    return BloomFilter.deserialize(cachedBloom);
  }

  //   async getBloomFromDB() {
  //     try {
  //       const stringifyCachedBloom = await this.idb.getAll({
  //         storeName: `stringify_bloom_${this.instanceName}`,
  //       });

  //       if (!stringifyCachedBloom || !stringifyCachedBloom.length) {
  //         return undefined;
  //       }

  //       const [{ tree }] = stringifyCachedBloom;

  //       return BloomFilter.deserialize(tree);
  //     } catch (err) {
  //       return undefined;
  //     }
  //   }

  async getBloomFromCache() {
    try {
      const bloom = await this.downloadBloom();
      //   await this.saveBloom({ bloom });

      return bloom;
    } catch (err) {
      return false;
    }
  }

  async checkBloom() {
    // let cachedBloom = await this.getBloomFromDB();
    // if (!cachedBloom) {
    //   cachedBloom = await this.getBloomFromCache();
    // }
    const cachedBloom = await this.getBloomFromCache();
    return cachedBloom.test(this.commitment);
  }

  //   async saveBloom({ bloom }) {
  //     try {
  //       await this.idb.putItem({
  //         storeName: `stringify_bloom_${this.instanceName}`,
  //         data: {
  //           hashBloom: '1', // need for replace bloom
  //           tree: bloom.serialize(),
  //         },
  //         key: 'hashBloom',
  //       });
  //     } catch (err) {
  //       console.error('saveBloom has error:', err.message);
  //     }
  //   }
}

export const bloomService = (payload: any) => new BloomService(payload);
