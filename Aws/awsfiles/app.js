require("dotenv").config();
const aws = require('aws-sdk');

const express = require('express');
const multer = require('multer');
const multers3 = require('multer-s3');
const uuid = require('uuid').v4;
const MongoClient = require('mongodb').MongoClient;
const path = require('path');

const app = express();

MongoClient.connect('mongodb://localhost', { useNewUrlParser: true, useUnifiedTopology: true})
     .then(client =>{
       console.log('Mongo connected');
       const db=client.db('myFiles');
       const collection = db.collection('files');
       app.locals.fileCollection = collection;
     });
//aws credentials



     const s3 = new aws.S3({ apiVersion: '2006-03-01'});


     const upload = multer({
        storage: multers3({
            s3,
            bucket: 'myfilesbucket123',
            acl: 'public-read',
            metadata: (req, file, cb)=> {
                cb(null, { fieldName: file.fieldname})
            },
            key: (req, file, cb) => {
                const ext = path.extname(file.originalname);
                cb(null, '${uuid()}${ext}');
            }
        })
     });

     app.use(express.static('public'));

     app.post('/upload', upload.single('appFile'), (req, res) => {
        const fileCollection = req.app.locals.fileCollection;
        const uploaded = req.file.location;
        console.log(req.file);

        fileCollection.insert({ filePath: uploaded})
           .then(result => {
            return res.json({ status: 'OK', ...result})
           });
     });

     app.get('/files', (req, res) => {
        const fileCollection = req.app.locals.fileCollection;
        fileCollection.find({})
           .toArray()
           .then(files => {
            const paths = files.map(({filePath}) => ({filePath}))
            return res.json(paths)
           })
     });
     app.listen(3005, ()=>console.log('App is listening'));