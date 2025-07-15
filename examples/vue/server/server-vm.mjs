(async () => {
    console.log('Importing Vite:');
    const { createServer } = await import('vite');

    console.log('Initializing new Vite SSR Project...')
    const server = await createServer();
    console.log('Server created!');
    await server.listen();
    console.log('Server listening!');
    server.printUrls();

    console.log('Todo: Initialize SSR module runner');
});

// tes?