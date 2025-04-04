import { faker } from '@faker-js/faker';
import { createMethod } from 'meteor/zodern:relay';
import { z } from 'zod';
import { ChatCollection, ChatSchema } from '../../chat/collection';

export const sendMessage = createMethod({
    name: 'sendMessage',
    schema: ChatSchema.pick({ content: true, user: true }),
    run(message) {
        return ChatCollection.insertAsync({
            ...message,
            createdAt: new Date(),
        });
    }
});

export const generateUsername = createMethod({
    name: 'generateUsername',
    schema: z.undefined(),
    run() {
        return faker.internet.userName();
    }
});