export function debounce<F extends (...args: any[]) => void>(func: F, delay: number): F {
  let timer: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  } as F;
}
