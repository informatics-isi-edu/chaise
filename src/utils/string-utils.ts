export function toTitlecase(str: string) {
  return str.replace(/[^-'\s]+/g, function (word) {
    return word.replace(/^./, function (first) {
      return first.toUpperCase();
    });
  });
}

export function underscoreToSpace(str: string) {
  return str.replace(/_/g, ' ');
}