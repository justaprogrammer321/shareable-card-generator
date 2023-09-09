const express=require("express");
const app=express();
const mongoose=require('mongoose');
const bodyParser =require("body-parser");
const ejs = require('ejs')
const multer = require('multer'); // Added multer
const path = require('path');
const shortid = require('shortid');

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

app.set('view engine','ejs')

app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb+srv://architbhrgv:3kdQH6YkRtY43VKE@cluster0.nx3uy3o.mongodb.net/?retryWrites=true&w=majority")
const notesSchema ={
    _id: {
        type: String,
        default: shortid.generate // Generate a unique ID for each document
    },
    title:String,
    content:String,
    imageData: Buffer, // Binary image data
    imageContentType: String, // MIME type of the image
}

const Note = mongoose.model("Note",notesSchema);

app.get("/",function (req,res){
    res.sendFile(__dirname + '/index.html' )
})
  
  app.post("/", upload.single('image'), function (req, res) {
    let newNote = new Note({
        title: req.body.title,
        content: req.body.content,
        imageData: req.file.buffer,
        imageContentType: req.file.mimetype,
    })
    newNote.save()
    .then((savedNote) => {
        console.log('Note saved successfully.');

        // Generate the link to view the newly created note
        const noteLink = `http://localhost:3000/${savedNote._id}`;
        
        // Send a JSON response with success message and note link
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
                res.render('index', {
                    note: note
                });
            }
        })
        .catch((err) => {
            console.error('Error finding note:', err);
            res.status(500).send('Error finding note.');
        });
});

app.listen(3000,function(){
    console.log("server is running on 3000")
})