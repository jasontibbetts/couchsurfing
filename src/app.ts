import express, { Application } from 'express';
import UserResource from './resources/user';
import bodyParser from 'body-parser';

export default async function initializeApp(): Promise<Application> {
    if (!process.env.MONGO_DATABASE || !process.env.MONGO_HOST ||  !process.env.MONGO_PORT || !process.env.MONGO_PASSWORD || !process.env.MONGO_USERNAME) {
        throw new Error("Missing required MongoDB env values");
    }
    const app = express();
    app.use(bodyParser.json());
    const userResource = await UserResource.factory({
        mongoCollection: 'users',
        mongoDatabase: process.env.MONGO_DATABASE,
        mongoHost: process.env.MONGO_HOST,
        mongoPort: process.env.MONGO_PORT,
        mongoPass: process.env.MONGO_PASSWORD,
        mongoUser: process.env.MONGO_USERNAME
    });
    app.use('/v1/users/', userResource.router);
    return app;
}