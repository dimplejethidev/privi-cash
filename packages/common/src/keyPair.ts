import { type BigNumberish } from 'ethers';
import { ethers } from 'ethers';
import { encrypt, decrypt, getEncryptionPublicKey } from '@metamask/eth-sig-util';
import { poseidonHash, toFixedHex } from './helpers';

const { BigNumber, Wallet } = ethers;

const ENCRYPTION_VERSION = 'x25519-xsalsa20-poly1305';

export function packEncryptedMessage(encryptedMessage: any) {
  const nonceBuf = Buffer.from(encryptedMessage.nonce, 'base64');
  const ephemPublicKeyBuf = Buffer.from(encryptedMessage.ephemPublicKey, 'base64');
  const ciphertextBuf = Buffer.from(encryptedMessage.ciphertext, 'base64');
  const messageBuff = Buffer.concat([
    Buffer.alloc(24 - nonceBuf.length),
    nonceBuf,
    Buffer.alloc(32 - ephemPublicKeyBuf.length),
    ephemPublicKeyBuf,
    ciphertextBuf,
  ]);
  return '0x' + messageBuff.toString('hex');
}

export function unpackEncryptedMessage(encryptedMessage: string) {
  if (encryptedMessage.slice(0, 2) === '0x') {
    encryptedMessage = encryptedMessage.slice(2);
  }
  const messageBuff = Buffer.from(encryptedMessage, 'hex');
  const nonceBuf = messageBuff.subarray(0, 24);
  const ephemPublicKeyBuf = messageBuff.subarray(24, 56);
  const ciphertextBuf = messageBuff.subarray(56);
  return {
    version: ENCRYPTION_VERSION,
    nonce: nonceBuf.toString('base64'),
    ephemPublicKey: ephemPublicKeyBuf.toString('base64'),
    ciphertext: ciphertextBuf.toString('base64'),
  };
}

export class KeyPair {
  privateKey: string;
  publicKey: BigNumberish;
  encryptionKey: string;

  /**
   * Initialize a new key pair. Generates a random private key if not defined
   */
  constructor(privatekey = Wallet.createRandom().privateKey) {
    this.privateKey = privatekey;
    this.publicKey = BigNumber.from(poseidonHash(this.privateKey));
    this.encryptionKey = getEncryptionPublicKey(privatekey.slice(2));
  }

  /**
   * Initialize new key-pair from address string
   */
  static fromAddress(address: string): KeyPair {
    if (address.length === 130) {
      address = address.slice(2);
    }
    if (address.length !== 128) {
      throw new Error('Invalid key length');
    }
    return Object.assign(new KeyPair(), {
      privateKey: '',
      publicKey: BigNumber.from('0x' + address.slice(0, 64)),
      encryptionKey: Buffer.from(address.slice(64, 128), 'hex').toString('base64'),
    });
  }

  /**
   * KeyPair with random private key
   */
  static createRandom(): KeyPair {
    return new KeyPair(Wallet.createRandom().privateKey);
  }

  toString() {
    return toFixedHex(this.publicKey) + Buffer.from(this.encryptionKey, 'base64').toString('hex');
  }

  equals(keyPair: KeyPair) {
    return BigNumber.from(this.publicKey).eq(keyPair.publicKey);
  }

  /**
   * Key address for this key-pair
   */
  address() {
    return this.toString();
  }

  /**
   * Sign a message using key pair private key
   */
  sign(commitment: BigNumberish, merklePath: BigNumberish) {
    return poseidonHash(this.privateKey, commitment, merklePath);
  }

  /**
   * Encrypt data using key-pair encryption key
   */
  encrypt(bytes: Buffer) {
    return packEncryptedMessage(
      encrypt({
        publicKey: this.encryptionKey,
        data: bytes.toString('base64'),
        version: ENCRYPTION_VERSION,
      }),
    );
  }

  /**
   * Decrypt data using key-pair private key
   */
  decrypt(data: string) {
    const decrypted = decrypt({
      encryptedData: unpackEncryptedMessage(data),
      privateKey: this.privateKey.slice(2),
    });
    return Buffer.from(decrypted, 'base64');
  }
}
