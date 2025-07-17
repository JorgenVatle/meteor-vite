import { execSync } from 'node:child_process';
import { inspect } from 'util';

/**
 * Verify that the provided environment variables are defined.
 * @template {string} T
 * @param {T[]} keys
 * @returns {{ [key in T]: string }}
 */
function getEnv(keys) {
    const entries = keys.map(key => {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return [key, value];
    });
    return Object.fromEntries(entries)
}

function patch(manifest) {
    console.log(inspect(manifest.spec.rules, { colors: true, depth: 10 }));

    execSync(`kubectl patch ingress preview -n ${APP_NAMESPACE} -p '${JSON.stringify(manifest)}'`, {
        stdio: 'inherit'
    })
}

const { APP_NAMESPACE, BASE_PATH, DEPLOYMENT_NAME } = getEnv(['APP_NAMESPACE', 'DEPLOYMENT_NAME', 'BASE_PATH']);

try {
    const manifest = JSON.parse(execSync(`kubectl get ingress preview -n ${APP_NAMESPACE} -o json`, {
        stdio: ['pipe', 'pipe', 'inherit']
    }).toString());

    /**
     * @type {{ paths: { path: string, pathType: string, backend: { service: { name: string, port: { number: number } } } }[] }}
     * @const http
     */
    const http = manifest.spec.rules[0].http

    /**
     * @type {{path: string, pathType: string, backend: {service: {name: string, port: {number: number}}}} | undefined}
     */
    let rule = http.paths.find(rule => rule.path === BASE_PATH);

    if (!rule) {
        http.paths.push({
            path: BASE_PATH,
            pathType: "Prefix",
            backend: {
                service: {
                    name: DEPLOYMENT_NAME,
                    port: {
                        number: 3000
                    }
                }
            },
        });
        patch(manifest)
    } else if (rule.backend.service.name !== DEPLOYMENT_NAME) {
        rule.backend.service.name = DEPLOYMENT_NAME;
        patch(manifest)
    }

} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}