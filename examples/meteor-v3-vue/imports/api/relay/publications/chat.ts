import { createPublication } from 'meteor/zodern:relay';
import * as z from 'zod';
import { ChatCollection } from '../../chat/collection';

export const subscribeToChat = createPublication({
    name: 'chat',
    schema: z.object({
        query: z.object({}),
        options: z.object({
            limit: z.number().optional(),
            sort: z.object({
                createdAt: z.number().optional(),
            }).optional(),
        }).optional(),
    }),
    run({ query, options }) {
        return ChatCollection.find(query, options);
    }
});