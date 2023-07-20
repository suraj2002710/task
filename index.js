const express=require("express")
const app=express()
const port=5000
const path=require('path')
const fs=require('fs')

const multer=require('multer')
const uuid=require('uuid')

const storage=multer.diskStorage({
    destination:function(req,file,cb) {
                cb(null,'./upload')
    },
    filename:function(req,file,cb) {
        cb(null,uuid.v4()+path.extname(file.originalname))
    }
})

const upload=multer({storage:storage})

app.use('/public',express.static(path.join('public')))

const dataFilePath = path.join(__dirname, 'data.json');
app.use(express.json())
app.use(express.urlencoded({extended:false}))

function readData(callback) {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
      if (err) {
        return callback(err, null);
      }
      try {
        const jsonData = JSON.parse(data);
        return callback(null, jsonData.items);
      } catch (parseError) {
        return callback(parseError, null);
      }
    });
  }
  
  function writeData(data, callback) {
    console.log(data);
      const jsonData = { items: data };
      fs.writeFile("data.json", JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
          if (err) {
              return callback(err);
            }
            return callback(null);
        });
    }

function createNewItem(itemData, callback) {
    readData((err, items) => {
      if (err) {
        return callback(err);
      }
      items=items? items:[]
      // Generate a new ID for the item
      const newId = Date.now();
  
      // Create the new item with the provided data
      const newItem = { id: newId, ...itemData };
  
      // Add the new item to the array of items
      console.log(items);
      items.push(newItem);
  
      // Save the updated data back to the JSON file
      writeData(items, (writeErr) => {
        if (writeErr) {
          console.log(items);
          return callback(writeErr);
        }
        return callback(null, newItem);
      });
    });
  }
  // writeData([{"id":1,"name":"suraj"}])
app.post('/createitem',upload.single('image'),(req,res)=>{
    let file=req.file ? req.file.path :""
    var items = {...req.body,image:file}
    

    createNewItem(items, (err, newItem) => {
        if (err) {
          console.error('Error creating new item:', err.message);
          res.send({
            err:err.message
          })
        } else {
          res.send({
            msg:"data created"
          })
          console.log('New item created:', newItem);
        }
      });

//     var it

//      readData((err, items) => {
//     if (err) {console.log(err);
//         return res.send({
//             status:false,
//             err:err,
//         })
//     }
//     const newItem = { id: Date.now(), ...itemData };
//     items.push(newItem);
//     writeData(items, (writeErr) => {
//       if (writeErr) {
//         return callback(writeErr);
//       }
//       return res.send({
//         status:false,
//         err:err,
//         msg:"data created",
//     })
//     });
//   });

})

function readItemsPerPage(pageNumber, itemsPerPage, callback) {
    readData((err, items) => {
      if (err) {
        return callback(err, null);
      }
  
      // Calculate start and end indices for the page
      const startIndex = (pageNumber - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      

      console.log(pageNumber,itemsPerPage);
      // Slice the items array to get the items for the current page
      const itemsForPage = items.slice(startIndex, endIndex);
  
      return callback(null, itemsForPage);
    });
  }
  
app.post('/getallitem',(req,res)=>{
    readItemsPerPage(req.body.pageNumber, req.body.itemsPerPage, (err, items) => {
        if (err) {

            res.send({
                status:false,
                err:err,
            })
          console.error('Error reading items:', err);
        } else {

          res.send({
                status:true,
            data:items
            })
            
        }
      })
})


function getItemById(id, callback) {
    readData((err, items) => {
      if (err) {
        return callback(err, null);
      }
  
      const foundItem = items.find((item) => item.id === id);
  
      if (!foundItem) {
        return callback(new Error('Item not found.'), null);
      }
  
      return callback(null, foundItem);
    });
  }

  app.post("/getsingleitem",(req,res)=>{
    getItemById(req.body.id, (err, item) => {
        if (err) {
            res.send({
                status:false,
                err:err,
            })
        } else {
            res.send({
                status:true,
                data:item
            })
          console.log('Item by ID:', item);
        }
      });
  })


  function updateItemById(id, updatedData, callback) {
    readData((err, items) => {
      if (err) {
        return callback(err);
      }
  
      const indexToUpdate = items.findIndex((item) => item.id == id);
      items.findIndex((item) =>{
        console.log( item.id == id,item.id, id);
        if( item.id == id){
          console.log(item);
        }
        // console.log(items);
      });
      if (indexToUpdate === -1) {
        return callback(new Error('Item not found.'));
      }
  
      const updatedItem = { ...items[indexToUpdate], ...updatedData };
      items[indexToUpdate] = updatedItem;
  
      writeData(items, (writeErr) => {
        if (writeErr) {
          return callback(writeErr);
        }
        return callback(null, updatedItem);
      });
    });
  }

  app.put('/itemupdate',upload.single("image"),(req,res)=>{
    let {id,desc,name,is_Active}=req.body
    console.log(req.body);
    let image=req.file ? req.file.path :""
    let updatedata={name,desc,image,is_Active}
    updateItemById(id,updatedata , (err, updatedItem) => {
        if (err) {
          console.log(err);
            res.send({
                status:false,
                err:err,
            })
        } else {
            res.send({
                status:false,
                data:updatedItem,
            })
        }
      });
  })

  function deleteItemById(id, callback) {
    readData((err, items) => {
      if (err) {
        return callback(err);
      }
  
      const indexToDelete = items.findIndex((item) => item.id === id);
  
      if (indexToDelete === -1) {
        return callback(new Error('Item not found.'));
      }
  
      const deletedItem = items.splice(indexToDelete, 1)[0];
  
      writeData(items, (writeErr) => {
        if (writeErr) {
          return callback(writeErr);
        }
        return callback(null, deletedItem);
      });
    });
  }
  
  app.delete('/deleteitem',(req,res)=>{
    deleteItemById(req.body.id, (err, deletedItem) => {
        if (err) {
            res.send({
                status:false,
                err:err,
            })
        } else {
            res.send({
                status:true,
              data:deletedItem
            })
        }
      });
  })


app.post('/productCreate',(req,res)=>{
    const {id,name,desc,image,is_Active}=req.body
    
})


app.listen(port,()=>{
    console.log("serveer started");
})