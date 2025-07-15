import { DDPConnection } from '../meteor/IPC/DDP';
import { NodeTransport } from '../meteor/IPC/transports/NodeTransport';
import { IPC } from '../meteor/IPC/transports/Transport';
import { DDPTransport } from '../meteor/IPC/transports/DDPTransport';
import Logger from '../utilities/Logger';

Logger.info('Spawned new Meteor-Vite worker process');

if (process.env.DDP_IPC) {
    const ddp = new DDPTransport(DDPConnection.init());
    IPC.addTransport(ddp);
}

if (process.channel) {
    const nodeIpc = new NodeTransport();
    IPC.addTransport(nodeIpc);
}

IPC.listen().catch((error: unknown) => {
    Logger.error(error);
    process.exit(1);
});

