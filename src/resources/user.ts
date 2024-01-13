import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import { Collection, MongoClient } from 'mongodb';

export interface UserDocument {
    _id: string;
    firstName: string;
    lastName: string;
    friends: string[];
}

export type UserResourceConfig = {
    mongoHost: string;
    mongoPort: string;
    mongoDatabase: string;
    mongoCollection: string;
    mongoUser: string;
    mongoPass: string;
};

export default class UserResource {
    public router: Router;
    private collection: Collection<UserDocument>;

    constructor(collection: Collection<UserDocument>) {
        this.router = Router();
        this.collection = collection;
        this.router.get('/', this.handleListUsers.bind(this));
        this.router.post('/', this.handleCreateUser.bind(this));
        this.router.get('/:id', this.handleReadUser.bind(this));
        this.router.put('/:id', this.handleUpdateUser.bind(this));
        this.router.delete('/:id', this.handleDeleteUser.bind(this));
        this.router.get('/distance/:from/:to', this.handleRelationshipDistance.bind(this));
    }

    private async handleListUsers(req: Request, res: Response): Promise<void> {
        try {
            const cursor = this.collection.find();
            res.status(200);
            res.setHeader('content-type', 'application/json');
            res.send(JSON.stringify(await cursor.toArray()));
        } catch(e) {
            res.status(500);
            res.send(JSON.stringify({ error: e instanceof Error ? e.message : String(e)}));
        }
        
    }

    private async handleCreateUser(req: Request, res: Response): Promise<void> {
        try {
            const userData: Omit<UserDocument, '_id'> = req.body;
            const _id = randomUUID();
            const result = await this.collection.insertOne({
                ...userData,
                _id
            });
            if (result.insertedId) {            
                const user = await this.collection.findOne({ _id });
                if (user) {
                    res.status(200);
                }
                res.send(JSON.stringify(user));
            } else {
                res.status(500);
                res.send({ error: 'failed to insert user' });
            }
        } catch (e) {
            res.status(500);
            res.send(JSON.stringify({ error: e instanceof Error ? e.message : String(e)}));
        }
    }

    private async handleReadUser(req: Request, res: Response): Promise<void> {
        try {
            const _id = req.params.id;
            const user = await this.collection.findOne({ _id });
            res.setHeader('content-type', 'application/json');
            if (user)  {
                res.status(200);
                res.send(JSON.stringify(user));
            } else {
                res.status(404);
                res.send(JSON.stringify({ error: `No user with found with id ${req.params.id}` }));
            }
        } catch (e) {
            res.status(500);
            res.send(JSON.stringify({ error: e instanceof Error ? e.message : String(e)}));
        }
    }

    private async handleUpdateUser(req: Request, res: Response): Promise<void> {
        try {
            const _id = req.params._id;
            const userData: Omit<UserDocument, '_id'> = req.body;
            const updated = { ...userData, _id }
            const result = await this.collection.updateOne({ _id }, updated, { upsert: false });
            if (result.modifiedCount) {
                res.status(200);
                res.send(JSON.stringify(updated));    
            }
        } catch (e) {
            res.status(500);
            res.send(JSON.stringify({ error: e instanceof Error ? e.message : String(e)}));
        }
        
    }

    private async handleDeleteUser(req: Request, res: Response): Promise<void> {
        try {
            const _id = req.params.id;
            const result = await this.collection.deleteOne({ _id });
            res.status(result.deletedCount ? 200 : 404);
            res.setHeader('content-type', 'application/json');
            res.send();
        } catch (e) {
            res.status(500);
            res.send(JSON.stringify({ error: e instanceof Error ? e.message : String(e)}));
        }
    }

    private async handleRelationshipDistance(req: Request, res: Response): Promise<void>  {
        try {
            res.status(200);
            res.setHeader('content-type', 'application/json');
            const fromUser = await this.collection.findOne({ _id: req.params.from });
            const toUser = await this.collection.findOne({ _id: req.params.to });
            if (!fromUser || !toUser) {
                res.status(400);
                res.send(JSON.stringify({ error: 'Missing required params' }));
            } else {
                const distance = await this.getDistance(fromUser, toUser);
                res.status(200);
                res.send(JSON.stringify({ from: fromUser._id, to: toUser._id, distance }));
            }
        } catch (e) {
            res.status(500);
            res.send(JSON.stringify({ error: e instanceof Error ? e.message : String(e)}));
        }
    }

    async getDistance(a: UserDocument, b: UserDocument, path: UserDocument[] = [], count = 0): Promise<UserDocument[]> {
        if (count > 10) {
            throw new Error('womp womp');
        }
        console.log(`getDistance(${a._id}, ${b._id}, ${path.length})`, a.friends);
        if (a.friends.includes(b._id)) {
            // direct friendship between a and b
            console.log(`User: ${a._id} is directly connected to ${b._id} as a friend`);
            return [...path, b];
        }
        // Check the distance for each friend
        for (const _id of a.friends) {
            const user = await this.collection.findOne({ _id });
            if (user) {
                const newPath = await this.getDistance(user, b, path);
                if (newPath) {
                    console.log(`User: ${a._id} has ${b._id} as a friend of a friend`);
                    return [...path, ...newPath];
                }
            }
        }
        console.log(`User: ${a._id} has no connection to ${b._id}`);
        return path;
    }

    static async factory({ mongoHost, mongoPort, mongoDatabase, mongoCollection, mongoPass, mongoUser }: UserResourceConfig): Promise<UserResource> {
        const client = new MongoClient(`mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}`, { family: 4, waitQueueTimeoutMS: 500 });
        await client.connect();
        const db = client.db(mongoDatabase);
        return new UserResource(db.collection(mongoCollection));
    }
}
