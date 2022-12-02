export const arrayDeepEqual = (arr1, arr2) => !(arr1.length == arr2.length && arr2.every((value, index) => value === arr1[index]))
