import { createServer } from 'https';
import { readFile  } from 'fs/promises';
import initializeApp from './app';

async function main(): Promise<void> {
    if (!process.env.HTTPS_PORT || !process.env.HTTPS_KEY ||  !process.env.HTTPS_CERT) {
        throw new Error("Missing required https env values");
    }
    
    const [key,cert] = await Promise.all([readFile(process.env.HTTPS_KEY), readFile(process.env.HTTPS_CERT)]);
    
    const app = await initializeApp();

    const server = createServer({
        key,
        cert
    }, app);

    server.listen(process.env.HTTPS_PORT, () => {
        console.log(`Listening on port ${process.env.HTTPS_PORT}`);
    });
}

main().catch(e => {
    console.log(`Unhandled exception ${e instanceof Error ? e.message : String(e)}`);
    process.exit();
});