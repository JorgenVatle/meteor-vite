declare module 'meteor/webapp' {
    import { StaticFiles } from 'meteor/webapp';
    namespace WebAppInternals {
        const staticFilesByArch: {
            'web.browser'?: StaticFiles;
            'web.browser.legacy'?: StaticFiles;
        }
    }
}
