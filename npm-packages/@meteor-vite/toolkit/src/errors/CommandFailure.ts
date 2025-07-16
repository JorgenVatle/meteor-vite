export class CommandFailure extends Error {}
export class CommandNotFound extends CommandFailure {}
export class MissingCommandArguments extends CommandFailure {}
