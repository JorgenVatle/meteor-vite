import type { DefinedPublications, MethodName, MethodParams, MethodResult, PublicationName } from 'meteor/meteor';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import {
    computed,
    type ComputedRef,
    markRaw,
    MaybeRef,
    onScopeDispose,
    reactive,
    Ref,
    ref,
    unref,
    watch,
    watchEffect,
} from 'vue';

export class MeteorVueClient<TClient extends MeteorDDPClient> {
    /**
     * Used to flush all active subscription handles.
     * This is done to work around situations in Meteor v3 where publications that depend on authorization won't re-run
     * when a user's login state changes, effectively locking up the subscription indefinitely.
     *
     * This seems to have been introduced by https://github.com/meteor/meteor/pull/13220
     */
    public readonly subscriptionTracker = new Tracker.Dependency();
    public readonly freezeSubscriptions = new ReactiveVar(false);
    
    constructor(protected readonly client: TClient) {
        if (Meteor.isServer) {
            return;
        }
        Tracker.autorun((computation) => {
            if (computation.firstRun) {
                return;
            }
            this.subscriptionTracker.changed();
        })
    }
    
    public call<TMethod extends MethodName>(
        methodName: TMethod,
        ...inputParams: MethodParams<TMethod>
    ): Promise<Awaited<MethodResult<TMethod>>> {
        return new Promise((resolve, reject) => {
            this.client.call(methodName, ...inputParams, (error: Error | undefined, response: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(response);
            });
        });
    }
    
    protected unrefParams<TParams extends MaybeRef<unknown>[]>(params: TParams) {
        return params.map((param) => unref(param));
    }
    
    public async loginWithPassword({ password, ...user }: { password: string } & ({ email: string } | { username: string })) {
        await new Promise<void>((resolve, reject) => {
            Meteor.loginWithPassword(user, password, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        })
    }
    
    public async logout() {
        await new Promise<void>((resolve, reject) => {
            Meteor.logout((error) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    }
    
    public subscription<TName extends PublicationName>(details: {
        name: TName,
        params: ParametersMaybeRef<DefinedPublications[TName]>,
        active?: MaybeRef<boolean>,
        freeze?: MaybeRef<boolean>,
    }) {
        const controls = reactive({
            active: details.active || true,
            freeze: details.freeze || false,
        })
        const freeze = new ReactiveVar(controls.freeze);
        const active = new ReactiveVar(controls.freeze);
        const params = new ReactiveVar(null as unknown[] | null);
        const ready = ref(false);
        
        const stopEffect = watchEffect(() => {
            active.set(controls.active);
            freeze.set(controls.freeze);
        });
        
        const stopWatcher = watch(() => this.unrefParams(details.params), (inputParams) => {
            params.set(inputParams);
        }, {
            immediate: true,
            deep: true,
        })
        
        let subscriptionHandle: Meteor.SubscriptionHandle | null = null;
        
        const computation = this._createTracker(() => {
            const subscribeParams = params.get();
            if (subscribeParams === null) {
                return;
            }
            if (this.freezeSubscriptions.get()) {
                return;
            }
            if (freeze.get()) {
                return;
            }
            if (!active.get()) {
                if (subscriptionHandle) {
                    subscriptionHandle.stop();
                    subscriptionHandle = null;
                }
                return;
            }
            this.subscriptionTracker.depend();
            subscriptionHandle = this.client.subscribe(details.name, ...subscribeParams, {
                onStop(error: unknown) {
                    if (!error) {
                        return;
                    }
                    console.warn(new Error(`[${details.name}] Subscription rejected:`), error, { params: params.get() });
                }
            });
            ready.value = subscriptionHandle.ready();
        });
        
        const teardown = () => {
            stopEffect();
            stopWatcher();
            computation.stop();
        }
        
        onScopeDispose(teardown);
        
        return reactive({
            teardown,
            ready,
            freeze: () => controls.freeze = true,
            pause: () => controls.active = false,
            resume: () => controls.active = true,
            unfreeze: () => controls.freeze = false,
        })
    }
    
    public subscribe<TName extends PublicationName>(publicationName: TName, ...inputParams: ParametersMaybeRef<DefinedPublications[TName]>) {
        const subscription = this.subscription({
            name: publicationName,
            params: inputParams,
        });
        
        return {
            ready: computed(() => subscription.ready),
            stop: () => subscription.teardown(),
            pause: () => subscription.pause(),
            resume: () => subscription.resume(),
            freeze: () => subscription.freeze(),
            unfreeze: () => subscription.unfreeze(),
        }
    }
    
    public computed<TReturnType>(
        compute: () => TReturnType,
        options?: {
            ready?: Ref<boolean>
        },
    ): TReturnType extends Mongo.Cursor<infer TDoc, infer TTransform>
       ? ComputedRef<TTransform>
       : ComputedRef<TReturnType>
    {
        const data: Ref<unknown> = ref();
        let firstRun = true;
        
        watchEffect((onCleanup) => {
            const computation = this._createTracker(() => {
                let result: any = compute();
                
                if (result instanceof Mongo.Cursor) {
                    result = result.fetch();
                }
                
                if (options?.ready && !options.ready.value && !firstRun) {
                    return;
                }
                
                if (typeof result === 'object' && result) {
                    result = markRaw(result);
                }
                
                firstRun = false;
                data.value = result;
            });
            onCleanup(() => computation.stop());
        });
        
        return computed(() => data.value) as any;
    }
    
    protected _createTracker(compute: () => void): { stop: () => void } {
        if (Meteor.isServer) {
            return { stop: () => {} }
        }
        return Tracker.autorun(compute);
    }
}

export default new MeteorVueClient(Meteor);

interface MeteorDDPClient {
    subscribe(publicationName: string, ...params: unknown[]): Meteor.SubscriptionHandle;
    call(methodName: string, ...params: unknown[]): unknown;
    callAsync(methodName: string, ...params: unknown[]): unknown;
}

type MaybeRefArray<TParams extends unknown[]> = [...{
    [key in keyof TParams]: MaybeRef<TParams[key]>
}]

export type ParametersMaybeRef<TFunction extends (...params: any) => any> = MaybeRefArray<Parameters<TFunction>>

declare module 'meteor/meteor' {
    interface DefinedPublications {}
    interface DefinedMethods {}
    
    // Comment out these two interfaces if you want to strictly define types for your Meteor methods and publications.
    interface DefinedPublications extends Record<string, (...params: unknown[]) => PublishReturnType> {}
    interface DefinedMethods extends Record<string, (...params: unknown[]) => unknown> {}
    
    type MethodName = Extract<keyof DefinedMethods, string>;
    type PublicationName = Extract<keyof DefinedMethods, string>;
    type MethodParams<TName extends MethodName> = Parameters<DefinedMethods[TName]>;
    type MethodResult<TName extends MethodName> = Awaited<ReturnType<DefinedMethods[TName]>>;
    type PublishReturnType = void | Mongo.Cursor<any> | Array<Mongo.Cursor<any>> | Promise<void | Mongo.Cursor<any> | Array<Mongo.Cursor<any>>>;
}