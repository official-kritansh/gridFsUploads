const express =require("express"),
      app =express(),
      mongoose =require("mongoose"),
      bodyParser =require("body-parser"),
      path =require("path"),
      multer =require("multer"),
      gridFsStorage =require("multer-gridfs-storage"),
      grid =require("gridfs-stream"),
      methodOverride =require("method-override");


//App Config
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.set("view engine","ejs");
//---------------
//Mongo Config
//---------------
//Mongo URI
const mongoURI ="mongodb://localhost/file_upload_1";
//Mongo connection
const conn =mongoose.createConnection(mongoURI);
//Initialize gfs
let gfs;

conn.once("open",()=>{
    //init stream
    gfs=grid(conn.db,mongoose.mongo);
    gfs.collection("file_upload_1");
});

//Create Storage Engine
const storage =new gridFsStorage({
    url:mongoURI,
    file:(req,file)=>{
        return new Promise((resolve,reject)=>{
            const filename =file.originalname;
            const fileInfo ={
                filename:filename,
                bucketName:"file_upload_1"
            }
            resolve(fileInfo);
        });
        
    }
});

const upload =multer({storage});



//@route for main page
app.get("/",(req,res)=>{
    gfs.files.find().toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
          res.render('index', { files: false });
        } else {
          files.map(file => {
            if (
              file.contentType === 'image/jpeg' ||
              file.contentType === 'image/png'
            ) {
              file.isImage = true;
            } else {
              file.isImage = false;
            }
          });
          res.render('index', { files: files });
        }
      });
});

//@route for posting form
app.post("/upload",upload.single("file"),(req,res)=>{
    res.redirect("/");
});
//@route to show non-image files
app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if file
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // If File exists this will get executed
        const readstream = gfs.createReadStream(file.filename);
        return readstream.pipe(res);
    });
});
  
  
  
//@route for displaying image file 
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if the input is a valid image or not
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }

        // If the file exists then check whether it is an image
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            // Read output to browser
             const readstream = gfs.createReadStream(file.filename);
             readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
});

//@route for deleting files
app.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'file_upload_1' }, (err, gridStore) => {
        if (err) {
            return res.status(404).json({ err: err });
        }

        res.redirect('/');
    });
});

app.listen(3000,()=>{
    console.log("server");
});