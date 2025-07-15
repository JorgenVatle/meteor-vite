# zodern:relay - Type safe Meteor methods and publications

zodern:relay allows you to easily write methods and publications, and have typescript check the types of the args and result wherever you call the method or subscribe to a publication.

#### /imports/methods/projects.ts:
```ts
import { createMethod } from 'meteor/zodern:relay';
import { z } from 'zod';
import { Projects } from '/shared/collections';

export const createProject = createMethod({
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    isPublic: z.boolean(),
  }),
  run({ name, description, isPublic }): string {
    let id = Projects.insert({
      name,

      // Type 'string | undefined' is not assignable to type 'string'.
      //   Type 'undefined' is not assignable to type 'string'.ts(2322)
      description,
      public: isPublic,
    });

    return id;
  },
});

```

#### /client/exampleProject.ts
```ts
import { createProject } from '/imports/methods/projects';

export async function createExampleProject() {
  // id has type of string
  const id = await createProject({
    // Property 'isPublic' is missing in type '{ name: string; }'
    // but required in type
    // '{ description?: string | undefined; name: string; isPublic: boolean; }'.ts(2345)
    name: 'Example',
  });
}

```

You might be wondering if this can expose server code on the client. None of the content of files in `methods` or `publications` directories are used on the client. If any of these files are imported on the client, their content is completely replaced. On the client, the files will export small functions for calling any methods or subscribing to any publications that were originally exported by the file.

## Getting started

1. Install `zodern:relay` and [`zod`](https://www.npmjs.com/package/zod)

```
meteor add zodern:relay
meteor npm install zod
```

2. Set up `@zodern/babel-plugin-meteor-relay`

```
meteor npm install @zodern/babel-plugin-meteor-relay
```

Create a `.babelrc` in the root of your Meteor app:

```json
{
  "plugins": [
    "@zodern/babel-plugin-meteor-relay"
  ]
}
```

3. Set up `zodern:types`

If you haven't already, add [`zodern:types`](https://atmospherejs.com/zodern/types) to your app so typescript can use the type definitions from `zodern:relay`.

## Methods

You can define methods in files in `methods` directories. The `methods` directories should not be inside a `client` or `server` folder so you can import the methods on both the client and server. The babel plugin will replace the content of these files when imported on the client, so you don't have to worry about server code being exposed.

```ts
import { createMethod } from 'meteor/zodern:relay';
import { z } from 'zod';

export const add = createMethod({
  name: 'add',
  schema: z.number().array().length(2),
  run([a, b]) {
    return a + b;
  },
});
```

`schema` is always required, and must be a schema created from the `zod` npm package. If the method does not have any arguments, you can use `zod.undefined()` as the schema. If you do not want to check the arguments, you can use `zod.any()`.

The schema is used to provide types for for the `run` function's parameter, and to check the arguments when calling the method.

The `name` is optional. If it is not provided, the babel plugin will add one based on the export name and file name.

`createMethod` returns a function you can use to call the method. The function returns a promise that resolves with the result. The result will have the same type as the return value of the `run` function.

```ts
import { add } from '/imports/methods/add'

add([1, 2]).then(result => {
  console.log(result) // logs 3
});
```

The method name, schema, or run function, are available on the `config` property of the function returned by `createMethod`:

```ts
import { add } from '/imports/methods/add';


console.log(
  add.config.name,
  add.config.schema,
  add.config.run
)
```

On the client, only `config.name` is defined.

## Publications

You can define publications in files in `publications` directories. The `publications` directories should not be inside a `client` or `server` folder so you can import the publications on both the client and server. The babel plugin will replace the content of these files when imported on the client, so you don't have to worry about server code being exposed.

```ts
import { createPublication } from 'meteor/zodern:relay';
import { z } from 'zod';
import { Projects } from '/collections';

export const subscribeProject = createPublication({
  name: 'project',
  schema: z.object({
    id: z.string()
  }),
  run({ id }) {
    return Projects.find({ _id: id });
  },
});
```

`schema` is always required, and must be a schema created from the `zod` npm package. If the method does not have any arguments, you can use `zod.undefined()` as the schema. If you do not want to check the arguments, you can use `zod.any()`.

The schema is used to provide types for for the `run` function's parameter, and to check the arguments when subscribing to the publication.

The `name` is optional. If it is not provided, the babel plugin will add one based on the export name and file name.

`createPublication` returns a function you can use to subscribe to the publication. This function returns a [Subscription Handle](https://docs.meteor.com/api/pubsub.html#Meteor-subscribe), the same as `Meteor.subscribe` would.

```ts
import { subscribeProject } from '/imports/publications/projects'

const exampleId = 'example';

subscribeProject({ id: exampleId });

subscribeProject({ id: exampleId }, {
  onStop(err) {
    console.log('subscription stopped', err);
  },
  onReady() {
    console.log('subscription ready');
  }
});
```

Like with methods, the function returned by `createPublication` has a `config` property to access the name, schema, and run function. On the client, only the name is available.

## Blocking

By default, methods and publications will [block](https://guide.meteor.com/methods.html#methods-vs-rest), meaning each session will run one method or publication at a time, in the order the client calls or subscribes. In cases where you do not want this behavior for a specific method or subscription, you can call `this.unblock()`.

Meteor has a bug for methods and publications with an async function where they will always be unblocked, and there is no way to have them block. `zodern:relay` fixes this so async methods and publications are consistent with Meteor's normal behavior.

## Rate limiting

Both `createMethod` and `createPublication` support a `rateLimit` option:
```ts
export const add = createMethod({
  name: 'add',
  schema: z.number().array().length(2),
  rateLimit: {
    interval: 2000,
    limit: 10
  },
  run([a, b]) {
    return a + b;
  },
});
```

`interval` is the number of ms before the rate limit is reset. `limit` is the maximum number of method calls or created subscriptions allowed per time interval.

## Pipelines

Instead of defining a single run function, a pipeline allows you to use an array of functions as a pipe. The output of each function is then used as the input of the next function. For example:

```ts
export const getTasks = createMethod({
  name: 'getTasks',
  schema: z.object({
    tag: z.string().optional()
    status: z.string().optional(),
  })
}).pipeline(
  (input) => ({ ...input, status: input.status || 'new' }),
  pickOrganization,
  ({ tag, status, organizationId }) => {
    return Tasks.find({ organizationId, status, tag }).fetch();
  }
);
```

Pipelines are configured by calling the `pipeline` function returned by `createMethod`. The `pipeline` function is only available when `run` function is not configured.

Each argument passed to the `pipeline` function is a step in the pipeline. This method has 3 steps in the pipeline. The first step takes the data sent from the client, and then returns an object with the status set to a default value. The next step takes that as the input, and then adds an `organizationId` property. The final step uses the completed input, and returns some documents from the database. Since this is the last step, its return value is sent to the client.

Benefits of pipelines:
- Allows you to break complicated methods and publications into multiple steps
- Types for the input are automatically inferred through the pipeline
- Composable: you can create functions that are used in the pipelines for many methods or publications. You can even create partial pipelines - groups of pipeline steps you can then add to pipelines while maintaining their types
- Reactive Publications: steps of the pipeline can optionally re-run when data in the database changes, allowing you to then change what cursors are published
- You can define global pipeline steps that run before and after every method or publication

### Re-usable pipeline steps

With js, you can simply create a function that returns the input for the next step:
```js
function pipelineStep(input) {
  // Do work...


  return input;
}
```

With typescript, you have to write it as a generic function so typescript can track the types in the pipeline:
```ts
function pipelineStep<T>(input: T) {
  // Do work...

  return input;
}

// Expects the input to have a projectId property
// Typescript will validate that the previous pipeline step returned an object
// with projectId
function pipelineStep<T extends { projectId: string }>(input: T) {
  let projectId = input;
  
  // Do work...

  return input;
}
```

If you are using the same group of pipeline steps for multiple methods or publications, you can create partial pipelines. Partial pipelines are created using the `partialPipeline` function:

```ts
import { partialPipeline } from 'meteor/zodern:relay';

let adminPipeline = partialPipeline(
  requireAdmin,
  unblock,
  auditAdmin
);

export const listUsers = createMethod({
  name: 'listUsers',
  schema: z.undefined()
}).pipeline(
  (input) => input,
  adminPipeline,
  () => Users.find().fetch();
);
```

For typescript to infer the types correctly in reusable steps or partial pipelines, they can not be used as the first step in the pipeline. As in the example above, you can have the first step be a simple function that returns the input. This then allows typescript to correctly infer the return type of `adminPipeline`.

### Pipeline step arguments

Each step in the pipeline is passed two arguments:
1. The output from the previous step. If the first step, it is given the initial data
2. The pipeline object.

The pipeline object has a number of useful functions and properties:
- `originalInput` the data given to the first step of the pipeline
- `type` either `method` or `publication`
- `name` the name of the method or publication
- `onResult` Pass `onResult` a callback to run when the method or publication finishes. The callback is given the final result. Please note that the callback should not modify the result.
- `onError` Pass `onError` a callback to run when the method or publication errors. If you want to change the error, the callback can return an error that should be used instead
- `stop` calling this will stop a publication's pipeline - the current step will finish, but subsequent steps will not run. This will also mark the subscription as ready. `stop` currently can not be used with methods.

Here is an example of a re-usable pipeline step that logs the results of methods

```ts
function logResult (input, pipeline) {
  if (pipeline.type === 'publication') {
    return;
  }

  pipeline.onResult((result) => {
    console.log(`Method ${pipeline.name} finished`);
    console.log('Result', result);
  });

  pipeline.onError((err) => {
    console.log(`Method ${pipeline.name} failed`);
    console.log('Error', err);
  });
}

```

### Global Pipeline

If you have a step you want to run before or after every method or publication, you can configure the global pipeline. Please note that the global pipeline should return the input unmodified. Any modifications will not be reflected in the types.

```ts
import { setGlobalMethodPipeline, setGlobalPublicationPipeline } from 'meteor/zodern:relay';

setGlobalMethodPipeline(
  auditMethods,
  logStatus
);

setGlobalPublicationPipeline(
  auditPublications,
  logStatus
);
```

### Reactive Publication Pipelines

Reactive pipelines allows steps of the pipeline to re-run when the results of a Mongo cursor change. This is useful for reactive joins, reacting to changes in permissions, and other use cases.

The function `withCursors` allows the pipeline to watch for changes in the database:

```js
function pipelineStep(input) {
  let cursor = Projects.find({ owner: Meteor.userId(), organization: input.organization });

  return withCursors(input, { projects: cursor });
}
```

`withCursors` accepts two arguments. The first one is the input for the next step. The second argument is an object with the Mongo queries to watch. The two objects are merged together, with the cursors being replaced with the cursor results. In the above example, the input for the next step will have a new `projects` property with the value being the results of the cursor.

When the results of any of the cursors change, the input for the next step will be updated and the pipeline will be re-run starting at the next step.

Here is a complete example:

```ts
createMethod({
  name: 'allTasks',
  schema: z.object({
    organization: z.string()
  }),
}).pipeline(
  (input) => {
    let cursor = Projects.find({ owner: Meteor.userId(), organization: input.organization });

    return withCursors(input, { projects: cursor });
  },
  (input) => {
    let projectIds = input.projects.map(project => project._id);

    return Tasks.find({ project: { $in: projectIds } });
  }
);
```

The first step of the pipeline creates a cursor to find all projects the user owns. This cursor is passed in the second object to `withCursors`, with the key `projects`.

The input of the second step has a new property named `projects`, matching what the key for the cursor. The `projects` property has an array of all the docs found by the cursor.

Whenever the results of the cursor change (maybe the user deleted a project or created a new one), the second step of the pipeline is re-run, with the `projects` property having the new list of docs. This allows it to replace the query being published to use the current list of projects.

Here is an example showing reacting to permission changes:

```ts
createMethod({
  name: 'adminListUsers',
  schema: z.undefined()
}).pipeline(
  (input) => {
    const user = Meteor.users.find({_id: Meteor.userId()});

    return withCursors(input, { user })
  },
  (input) => {
    const [ user ] = input.user;

    if (user.isAdmin) {
      return Users.find().fetch();
    }

    return [];
  }
);
```

The first step of the pipeline creates a cursor to get the doc for the current user. The second step then uses the doc to check if the user is an admin to decide if it should publish the data. If the user's doc is later modified so they are no longer an admin, the second step of the pipeline will then re-run, allowing it to stop publishing any data.


## Method Stubs

By default, no code you write in `methods` directories will be kept on the client. However, you can mark specific methods that you want to also use as stubs on the client. In this case, `zodern:relay` only keeps two pieces of code on the client:

- The stub function itself 
- The specific imports used by the stub function

To re-use the`run` function for a method as the stub on the client, you can set the `stub` option to `true`.

```ts
import { Tasks } from '/collections';
import { createMethod } from 'meteor/zodern:relay';

export const createTask = createMethod({
  schema: z.string(),
  stub: true,
  run(name) {
    Tasks.insert({ name, owner: Meteor.userId() });
  }
});
```

To use a different method for the stub, configure it using the `stop` property:

```ts
import { Tasks, Events } from '/collections';
import { createMethod } from 'meteor/zodern:relay';

export const createTask = createMethod({
  schema: z.string(),
  stub() {
    Tasks.insert({ name, owner: Meteor.userId() });
  },
  run(name) {
    checkPermissions(Meteor.userId());
    Tasks.insert({ name, owner: Meteor.userId() });
    sendEmail();
    Events.insert({ type: 'task.add', user: Meteor.userId() })
  }
});
```

In the above example, only the stub function would be kept on the client:
```ts
  stub() {
    Tasks.insert({ name, owner: Meteor.userId() });
  }
```

Since this function uses the imported `Tasks`, that import will also be kept on the client:

```ts
import { Tasks } from '/collections';
```

> At this time, stubs are not supported for methods that use pipelines
