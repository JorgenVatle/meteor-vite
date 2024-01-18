import { Mongo } from 'meteor/mongo';
import Valibot from 'valibot';

export default new Mongo.Collection<LinkDocument>('links');

export const LinkSchema = Valibot.object({
    url: Valibot.string([Valibot.maxLength(512)]),
    title: Valibot.string([Valibot.maxLength(512)]),
});

export interface LinkDocument {
    _id: string;
    url: string;
    title: string;
}