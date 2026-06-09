// Lets TypeScript accept asset imports that Metro resolves to module ids at runtime.
declare module '*.wav' {
  const src: number;
  export default src;
}
declare module '*.mp3' {
  const src: number;
  export default src;
}
