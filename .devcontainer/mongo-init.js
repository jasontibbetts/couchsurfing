db = db.getSiblingDB('admin');
db.auth(
    process.env.MONGO_INITDB_ROOT_USERNAME,
    process.env.MONGO_INITDB_ROOT_PASSWORD,
);
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);

db.users.insertOne({ _id: '1', firstName: 'jason', lastName: 'tibbetts', friends: ['2'] });
db.users.insertOne({ _id: '2', firstName: 'gabe', lastName: 'smith', friends: ['3'] });
db.users.insertOne({ _id: '3', firstName: 'john', lastName: 'jones', friends: ['4'] });
db.users.insertOne({ _id: '4', firstName: 'april', lastName: 'flowers', friends: ['5'] });
db.users.insertOne({ _id: '5', firstName: 'candice', lastName: 'mcdonnel', friends: ['6'] });
db.users.insertOne({ _id: '6', firstName: 'rebecca', lastName: 'cederbaum', friends: ['7'] });
db.users.insertOne({ _id: '7', firstName: 'jane', lastName: 'doe', friends: ['1'] });