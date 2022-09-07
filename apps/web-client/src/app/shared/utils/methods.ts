import { v4 as uuid } from 'uuid';
import { Option } from './types';

export function isNull<T>(x: Option<T>): x is null {
  return x === null;
}

export function isNotNull<T>(x: Option<T>): x is T {
  return x !== null;
}

export function isChildOf(
  element: Option<HTMLElement>,
  matchFn: (element: HTMLElement) => boolean
): boolean {
  if (element === null) {
    return false;
  }

  if (matchFn(element)) {
    return true;
  }

  return isChildOf(element.parentElement, matchFn);
}

export function getFirstParentId(
  element: Option<HTMLElement>,
  matchFn: (element: HTMLElement) => boolean
): Option<string> {
  if (element === null) {
    return null;
  }

  if (matchFn(element)) {
    return element.id;
  }

  return getFirstParentId(element.parentElement, matchFn);
}

export function generateId() {
  return uuid();
}
