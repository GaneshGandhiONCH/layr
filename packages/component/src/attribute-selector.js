import {hasOwnProperty} from 'core-helpers';
import omit from 'lodash/omit';
import cloneDeep from 'lodash/cloneDeep';
import isPlainObject from 'lodash/isPlainObject';
import ow from 'ow';

import {isComponentClassOrInstance, getHumanTypeOf} from './utilities';

export const AttributeSelector = {
  fromNames(names) {
    ow(names, 'names', ow.array);

    const attributeSelector = {};

    for (const name of names) {
      attributeSelector[name] = true;
    }

    return attributeSelector;
  },

  fromAttributes(attributes) {
    ow(attributes, 'attributes', ow.iterable);

    const attributeSelector = {};

    for (const attribute of attributes) {
      attributeSelector[attribute.getName()] = true;
    }

    return attributeSelector;
  },

  get(attributeSelector, name) {
    ow(name, 'name', ow.string.nonEmpty);

    attributeSelector = this.normalize(attributeSelector);

    if (typeof attributeSelector === 'boolean') {
      return attributeSelector;
    }

    return this.normalize(attributeSelector[name]);
  },

  set(attributeSelector, name, subattributeSelector) {
    ow(name, 'name', ow.string.nonEmpty);

    attributeSelector = this.normalize(attributeSelector);

    if (typeof attributeSelector === 'boolean') {
      return attributeSelector;
    }

    subattributeSelector = this.normalize(subattributeSelector);

    if (subattributeSelector === false) {
      return omit(attributeSelector, name);
    }

    return {...attributeSelector, [name]: subattributeSelector};
  },

  clone(attributeSelector) {
    return cloneDeep(attributeSelector);
  },

  isEqual(attributeSelector, otherAttributeSelector) {
    return (
      attributeSelector === otherAttributeSelector ||
      (this.includes(attributeSelector, otherAttributeSelector) &&
        this.includes(otherAttributeSelector, attributeSelector))
    );
  },

  includes(attributeSelector, otherAttributeSelector) {
    attributeSelector = this.normalize(attributeSelector);
    otherAttributeSelector = this.normalize(otherAttributeSelector);

    if (attributeSelector === otherAttributeSelector) {
      return true;
    }

    if (typeof attributeSelector === 'boolean') {
      return attributeSelector;
    }

    if (typeof otherAttributeSelector === 'boolean') {
      return !otherAttributeSelector;
    }

    for (const [name, otherSubattributeSelector] of Object.entries(otherAttributeSelector)) {
      const subattributeSelector = attributeSelector[name];

      if (!this.includes(subattributeSelector, otherSubattributeSelector)) {
        return false;
      }
    }

    return true;
  },

  add(attributeSelector, otherAttributeSelector) {
    attributeSelector = this.normalize(attributeSelector);
    otherAttributeSelector = this.normalize(otherAttributeSelector);

    if (attributeSelector === true) {
      return true;
    }

    if (attributeSelector === false) {
      return otherAttributeSelector;
    }

    if (otherAttributeSelector === true) {
      return true;
    }

    if (otherAttributeSelector === false) {
      return attributeSelector;
    }

    for (const [name, otherSubattributeSelector] of Object.entries(otherAttributeSelector)) {
      const subattributeSelector = attributeSelector[name];

      attributeSelector = this.set(
        attributeSelector,
        name,
        this.add(subattributeSelector, otherSubattributeSelector)
      );
    }

    return attributeSelector;
  },

  remove(attributeSelector, otherAttributeSelector) {
    attributeSelector = this.normalize(attributeSelector);
    otherAttributeSelector = this.normalize(otherAttributeSelector);

    if (otherAttributeSelector === true) {
      return false;
    }

    if (otherAttributeSelector === false) {
      return attributeSelector;
    }

    if (attributeSelector === true) {
      throw new Error(
        "Cannot remove an 'object' attribute selector from a 'true' attribute selector"
      );
    }

    if (attributeSelector === false) {
      return false;
    }

    for (const [name, otherSubattributeSelector] of Object.entries(otherAttributeSelector)) {
      const subattributeSelector = attributeSelector[name];

      attributeSelector = this.set(
        attributeSelector,
        name,
        this.remove(subattributeSelector, otherSubattributeSelector)
      );
    }

    return attributeSelector;
  },

  iterate(attributeSelector) {
    ow(attributeSelector, 'attributeSelector', ow.object);

    const AttributeSelector = this;

    return {
      *[Symbol.iterator]() {
        for (const [name, subattributeSelector] of Object.entries(attributeSelector)) {
          const normalizedSubattributeSelector = AttributeSelector.normalize(subattributeSelector);

          if (normalizedSubattributeSelector !== false) {
            yield [name, normalizedSubattributeSelector];
          }
        }
      }
    };
  },

  pick(value, attributeSelector, options = {}) {
    ow(options, 'options', ow.object.exactShape({includeAttributeNames: ow.optional.array}));

    attributeSelector = this.normalize(attributeSelector);

    if (attributeSelector === false) {
      throw new Error(
        `Cannot pick attributes from a value when the specified attribute selector is 'false'`
      );
    }

    const {includeAttributeNames = []} = options;

    return this._pick(value, attributeSelector, {includeAttributeNames});
  },

  _pick(value, attributeSelector, {includeAttributeNames}) {
    if (attributeSelector === true) {
      return value;
    }

    if (value === undefined) {
      return undefined;
    }

    if (isPlainObject(value)) {
      return this._pickFromObject(value, attributeSelector, {includeAttributeNames});
    }

    if (Array.isArray(value)) {
      return this._pickFromArray(value, attributeSelector, {includeAttributeNames});
    }

    throw new Error(
      `Cannot pick attributes from a value that is not a plain object or an array (value type: '${getHumanTypeOf(
        value
      )}')`
    );
  },

  _pickFromObject(object, attributeSelector, {includeAttributeNames}) {
    const result = {};

    for (const name of includeAttributeNames) {
      if (hasOwnProperty(object, name)) {
        result[name] = object[name];
      }
    }

    for (const [name, subattributeSelector] of this.iterate(attributeSelector)) {
      const value = object[name];

      result[name] = this._pick(value, subattributeSelector, {includeAttributeNames});
    }

    return result;
  },

  _pickFromArray(array, attributeSelector, {includeAttributeNames}) {
    return array.map(value => this._pick(value, attributeSelector, {includeAttributeNames}));
  },

  traverse(value, attributeSelector, iteratee, options = {}) {
    ow(iteratee, 'iteratee', ow.function);
    ow(
      options,
      'options',
      ow.object.exactShape({
        includeSubtrees: ow.optional.boolean,
        includeLeafs: ow.optional.boolean
      })
    );

    attributeSelector = this.normalize(attributeSelector);

    const {includeSubtrees = false, includeLeafs = true} = options;

    if (attributeSelector === false) {
      return;
    }

    this._traverse(value, attributeSelector, iteratee, {
      includeSubtrees,
      includeLeafs,
      _context: {},
      _isDeep: false
    });
  },

  _traverse(
    value,
    attributeSelector,
    iteratee,
    {includeSubtrees, includeLeafs, _context, _isDeep}
  ) {
    if (attributeSelector === true || value === undefined) {
      if (includeLeafs) {
        iteratee(value, attributeSelector, _context);
      }

      return;
    }

    if (Array.isArray(value)) {
      const array = value;

      for (const value of array) {
        this._traverse(value, attributeSelector, iteratee, {
          includeSubtrees,
          includeLeafs,
          _context,
          _isDeep
        });
      }

      return;
    }

    const isComponent = isComponentClassOrInstance(value);

    if (!(isComponent || isPlainObject(value))) {
      throw new Error(
        `Cannot traverse attributes from a value that is not a component, a plain object, or an array (value type: '${getHumanTypeOf(
          value
        )}')`
      );
    }

    const componentOrObject = value;

    if (_isDeep && includeSubtrees) {
      iteratee(componentOrObject, attributeSelector, _context);
    }

    for (const [name, subattributeSelector] of this.iterate(attributeSelector)) {
      const value = isComponent
        ? componentOrObject.getAttribute(name).getValue({throwIfUnset: false})
        : componentOrObject[name];

      this._traverse(value, subattributeSelector, iteratee, {
        includeSubtrees,
        includeLeafs,
        _context: {name, object: componentOrObject},
        _isDeep: true
      });
    }
  },

  normalize(attributeSelector) {
    if (attributeSelector === undefined) {
      return false;
    }

    if (typeof attributeSelector === 'boolean') {
      return attributeSelector;
    }

    if (isPlainObject(attributeSelector)) {
      return attributeSelector;
    }

    throw new Error(
      `Expected a valid attribute selector, but received a value of type '${getHumanTypeOf(
        attributeSelector
      )}'`
    );
  }
};
