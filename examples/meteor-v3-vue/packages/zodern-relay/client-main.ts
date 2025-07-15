function createError(funcName: string, folder: string) {
  throw new Error(`${funcName} should never be called on the client.
Ensure you have @zodern/babel-plugin-meteor-reify configured, or
you are calling ${funcName} only in files inside a ${folder} directory`);
}

export function createMethod() {
  throw createError('createMethod', 'methods');
}

export function createPublication() {
  throw createError('createPublication', 'publications');
}
