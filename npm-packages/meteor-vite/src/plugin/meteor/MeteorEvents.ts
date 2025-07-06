import { EventEmitter } from 'events';
import Logger from '../../utilities/Logger';

type MeteorIPCTopic = 'webapp-reload-client' | 'webapp-pause-client' | 'client-refresh';

export type MeteorIPCMessage = {
    type: 'METEOR_IPC_MESSAGE',
    responseId: string,
    topic: MeteorIPCTopic,
    encodedPayload: string
}

class MeteorEventBus {
    protected readonly events = new EventEmitter();
    
    /**
     * Wait for one of the provided IPC message topics before resolving the promise.
     *
     * @param {{topics: MeteorIPCTopic[], timeoutMs: number}} event
     * @returns {Promise<void>}
     */
    public waitForMessage(event: {
        /**
         * Meteor IPC event name.
         * E.g. webapp-reload-client, client-refresh
         */
        topic: MeteorIPCTopic[],
        
        /**
         * How long to wait before rejecting the promise.
         * Useful to prevent a promise from hanging indefinitely.
         */
        timeoutMs: number
    }) {
        const awaitedEvents = event.topic.map((topic) => awaitEvent({
            emitter: this.events,
            name: topic,
            timeoutMs: event.timeoutMs,
        }));
        
        return Promise.race(awaitedEvents);
    }
    
    public ingest(message: MeteorIPCMessage) {
        Logger.debug('Received Meteor IPC message:', message);
        this.events.emit(message.topic);
    }
}


function awaitEvent<
    Emitter extends EventEmitter,
    EventParams extends Parameters<Emitter['once']>,
    ListenerArgs extends Parameters<EventParams[1]>
>(event: {
    name: EventParams[0];
    emitter: Emitter;
    timeoutMs: number;
}) {
    return new Promise<ListenerArgs>((_resolve, _reject) => {
        let rejected = false;
        let resolved = false;
        
        const listener = (data: ListenerArgs) => {
            resolve(data);
        }
        
        const reject = (error: Error) => {
            if (resolved || rejected) return;
            rejected = true;
            event.emitter.removeListener(event.name, listener);
            
            _reject(error);
        }
        
        const resolve = (data: ListenerArgs) => {
            if (resolved || rejected) return;
            resolved = true;
            
            _resolve(data);
        }
        
        event.emitter.once(event.name, listener);
        setTimeout(() => reject(new EventTimeout(`Timed out waiting for event: ${String(event.name)}`)), event.timeoutMs);
    })
}

const MeteorEvents = new MeteorEventBus();

export class EventTimeout extends Error {}
export default MeteorEvents;
