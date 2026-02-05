import { bugs, homepage, version } from '../../../package.json';

export { version, bugs, homepage }

export function documentationLink(section: SectionId) {
    return `${homepage}#${section}`;
}

type SectionId =
    | 'meteor-vite'
    | 'key-features'
    | 'starter-templates'
    | 'installation'
    | 'meteor-v3'
    | 'meteor-v2'
    | 'application-structure'
    | 'packagejson'
    | 'vite-config'
    | '%EF%B8%8F-final-steps'
    | 'example-with-vue-3'
    | 'example-with-vue-27'
    | 'example-with-react'
    | 'react-with-atmospheres-react-meteor-data-package'
    | 'configuration'
    | 'meteor-plugin-settings'
    | 'features-in-depth'
    | 'lazy-loaded-meteor-packages'
    | 'stub-validation'
    | 'avoid-imports-in-meteors-client-mainmodule'
    | 'meteor-build-plugins'
    | 'compatability-with-zodernrelay'
    | 'package-details'
    | 'roadmap';


export const ViteEnvironmentName = {
    server: 'server',
    client: 'client',
} as const;
