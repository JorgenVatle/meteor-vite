import { CommandDefinition } from '@/lib/CommandDefinition';

export default [
    new CommandDefinition('kube-deploy', {
        title: 'Deploy a preview to Kubernetes',
        description: 'Creates a temporary deployment to a Kubernetes cluster for previewing changes from pull requests or branches.',
        fields: {
        },
        handler: async () => {
        
        }
    })
]