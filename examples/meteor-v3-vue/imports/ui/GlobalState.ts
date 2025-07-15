import { reactive } from 'vue';
import { generateUsername } from '../api/relay/methods/chat';

export const GlobalState = reactive({
    currentTime: Date.now(),
});

export const CurrentUser = reactive({
    name: 'Unknown user',
});

Meteor.startup(async () => {
    if (!Meteor.isClient) {
        return;
    }
    
    CurrentUser.name = await generateUsername();
    setInterval(() => {
        GlobalState.currentTime = Date.now();
    }, 1250);

})
