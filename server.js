const express = require("express");
const app = express();
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const multer = require('multer');
const path = require('path');
const shortid = require('shortid');
require('dotenv').config();
const mongodbURI = process.env.MONGODB_URI;
const vercelURL = process.env.VERCEL_URL;

const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(mongodbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const notesSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: shortid.generate // Generate a unique ID for each document
    },
    title: String,
    content: String,
    imageData: Buffer, // Binary image data
    imageContentType: String, // MIME type of the image
    createdAt: {
        type: Date,
        default: Date.now,
        // Expires after 3 minutes (3 * 60 * 1000 milliseconds)
        expires: 180 // TTL index in seconds (180 seconds = 3 minutes)
    },
    theme: {
        type: String,
        enum: ['default', 'christmas', 'birthday'], // Add any other theme options
        default: 'default' // Set default theme to 'default'
    }
});


const Note = mongoose.model("Note", notesSchema);

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.post("/", upload.single('image'), function (req, res) {
    let newNote = new Note({
        title: req.body.title,
        content: req.body.content,
        imageData: req.file.buffer,
        imageContentType: req.file.mimetype,
    });

    newNote.save()
        .then((savedNote) => {
            console.log('Note saved successfully.');

            const noteLink = `https://${vercelURL}/${savedNote._id}`;

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

                res.render('index', {
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

// Create TTL index after establishing the connection to the database
mongoose.connection.once('open', () => {
    Note.createIndexes({ createdAt: 1 }, { expireAfterSeconds: 180 });
    console.log('TTL index created successfully.');
});

app.listen(port, function () {
    console.log("Server is running on port " + port);
});
