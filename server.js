const express = require("express");
const app = express();
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const multer = require('multer');
const path = require('path');
const shortid = require('shortid');
const cors = require('cors');
require('dotenv').config();

const mongodbURI = process.env.MONGODB_URI;
const vercelURL = process.env.VERCEL_URL;

const port = process.env.PORT || 4000;

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 10 * 1024 * 1024, // Increase the limit to 10 MB
    }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(mongodbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const notesSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: shortid.generate // Generate a unique ID for each document
    },
    title: String,
    content: String,
    frontimg: String,
    innerimg: String,
    textsideimg: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // TTL index in seconds (86400 seconds = 24 hours)
    }
});

const Note = mongoose.model("carddata", notesSchema);

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.post("/", upload.single('image'), function (req, res) {
    let newNote = new Note({
        title: req.body.title,
        content: req.body.content,
        innerimg: req.body.innerimg,
        frontimg: req.body.frontimg,
        textsideimg: req.body.textsideimg
    });

    newNote.save()
        .then((savedNote) => {
            console.log('Note saved successfully.');

            const noteLink = `http://192.168.100.129:8000/${savedNote._id}`;

            res.json({ success: true, message: 'Note saved successfully!', noteLink });
        })
        .catch((err) => {
            console.error('Error saving note:', err);
            res.status(500).json({ success: false, message: 'Error saving note.' });
        });
});

app.get("/:id", (req, res) => {
    const noteId = req.params.id;

    Note.findById(noteId)
        .exec()
        .then((note) => {
            if (!note) {
                res.status(404).send('Note not found.');
            } else {
                const noteLink = `https://${vercelURL}/${note._id}`;
                let pagetoberendered = "index";
                if (note.textsideimg) {
                    pagetoberendered = "custom";
                }

                res.render(pagetoberendered, {
                    note: note,
                    noteLink: noteLink
                });
            }
        })
        .catch((err) => {
            console.error('Error finding note:', err);
            res.status(500).send('Error finding note.');
        });
});

app.listen(port, function () {
    console.log("Server is running on port " + port);
});
