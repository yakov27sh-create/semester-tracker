function setIntersection<T>(A: Set<T>, B: Set<T>) {
  return new Set([...A].filter((item) => B.has(item)));
}

function setUnion<T>(A: Set<T>, B: Set<T>) {
  return new Set([...A, ...B]);
}

/** Remove all items in source that are also in target **/
function setRelativeComplement<T>(source: Set<T>, target: Set<T>) {
  const intersection = setIntersection(source, target);
  return new Set([...source].filter((i) => !intersection.has(i)));
}

export { setIntersection, setUnion, setRelativeComplement };
