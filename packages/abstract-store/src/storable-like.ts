import {Component} from '@liaison/component';
import {getTypeOf} from 'core-helpers';

import type {AbstractStore} from './abstract-store';

export class StorableLike extends Component {
  static getStore: () => AbstractStore;

  static hasStore: () => boolean;

  static __setStore: (store: AbstractStore) => void;

  static isStorable: (value: any) => value is typeof StorableLike;
}

export function isStorableLikeClass(value: any): value is typeof StorableLike {
  return typeof value?.isStorable === 'function';
}

export function assertIsStorableLikeClass(value: any): asserts value is typeof StorableLike {
  if (!isStorableLikeClass(value)) {
    throw new Error(
      `Expected a storable class, but received a value of type '${getTypeOf(value)}'`
    );
  }
}