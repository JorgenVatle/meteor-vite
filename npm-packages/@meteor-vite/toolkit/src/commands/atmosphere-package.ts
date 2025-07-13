import { CommandDefinition } from '@/lib/CommandDefinition';
import { Parser } from '@/lib/CommandLineArgs/defineParser';
import { CommandList } from '@/lib/CommandList';

const sharedParser = new Parser({
    rootDir: {
        type: String,
        description: `Path to the Meteor package's root directory. (where package.js lives)`
    }
})

const subCommands = new CommandList([
    new CommandDefinition('version', {
        title: 'Update package.js version',
        description: `Patch Meteor's package.js file to match the current changeset release`,
        fields: sharedParser.fields,
        handler: async () => {
        
        }
    }),
    
    new CommandDefinition('publish', {
        title: 'Publish package to Atmosphere',
        description: `Build and publish the package to Atmosphere if out of date`,
        fields: sharedParser.fields,
        handler: async () => {
        
        }
    }),
    
    new CommandDefinition('format-changeset', {
        title: 'Format package name in changeset',
        description: 'Rewrites the package name in changesets and npm workspaces to ensure the package shows up in the correct format in the final changelog. (e.g. replaces jorgenvatle_vite with jorgenvatle:vite)',
        fields: sharedParser.fields,
        handler: async () => {
        
        }
    }),
    
    new CommandDefinition('unformat-changeset', {
        title: 'Revert changeset formatting',
        description: 'Revert changes from `format-changeset` to the original package name in the changeset. npm will complain otherwise',
        fields: sharedParser.fields,
        handler: async () => {
        
        }
    })
])

export default [
    new CommandDefinition('atmosphere-package', {
        title: 'Manage npm, Atmosphere and changeset package versioning',
        description: 'Utilities for bumping Atmosphere package versions and formatting changeset files to match Meteor conventions.',
        fields: {
            command: {
                type: String,
                description: `Subcommand for Atmosphere package management.`,
                defaultOption: true,
                typeLabel: 'command',
            },
        },
        subCommands,
        handler: async () => {
        
        }
    })
]
