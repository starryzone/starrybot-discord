export const throwErr = (errorMessage: string): never => {
  throw new Error(errorMessage);
};
