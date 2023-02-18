import { ethers } from 'hardhat';
const { BigNumber } = ethers;
import { ZERO_LEAF } from '@privi-cash/common';

export const ZERO_VALUE = ZERO_LEAF;
export const FIELD_SIZE = BigNumber.from(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
).toHexString();

export const TREE_HEIGHT = 20;
