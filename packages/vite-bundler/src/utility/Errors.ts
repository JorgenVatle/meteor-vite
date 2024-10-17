export class MeteorViteError extends Error {
constructor(message: string, details?: { cause?: unknown }) {
        super(
            `⚡  ${message}`,
            // @ts-expect-error Might or might not be supported depending on Meteor's node version.
            details
        );
    }
}