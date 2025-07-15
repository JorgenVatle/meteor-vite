import { Mongo } from 'meteor/mongo';
import { z } from 'zod';

export const ChatCollection = new Mongo.Collection<ChatDocument, ChatDocument>('chat');

export interface ChatDocument extends z.infer<typeof ChatSchema> {
    _id: string;
}

export const ChatSchema = z.object({
    content: z.string().max(1024),
    createdAt: z.date(),
    user: z.object({
        name: z.string().max(100),
    }),
});