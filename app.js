const express=require('express');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const _ =require('lodash');
const app=express();


// let items=['Buy Food','Cook Food','Eat Food'];
// let workItems=[];
app.set('view engine','ejs')  // we tell our app to use EJS by using this line of code.

// create a folder which name is views and put all ejs file inside the views folder because we use view engine

// anything is valid html is also valid for EJS.So, there is no complexity.

// res.send is used to send only one piece of data but if there is needed to send multiple piece of data at a time then what should we do? Then we use res.write() method and we use res.write() multiple time.


app.use(bodyParser.urlencoded({extended:true}))   /// we told our app to use body-parser
app.use(express.static("public"))  // tell javascript to serve this static folder.


// connnect mongoose with mongoDB Server
mongoose.connect("mongodb://localhost:27017/todoListDB",{useNewUrlParser: true,useUnifiedTopology: true,
family: 4});


// Create New Item schema 
const itemsSchema=new mongoose.Schema({
    name: String
})


//create a new model based on this schema.
const Item=mongoose.model('Item',itemsSchema);

// Create three new item that in items array initially while load the page

const item1= new Item({
    name:'Welcome to our TODO List.'
})

const item2= new Item({
    name:'Hit + Button to add a new Item.'
})

const item3= new Item({
    name:'--> Hit this to delete this item.'
})


// put all of these default items in an array.
const defaultItems=[item1,item2,item3];



// Create a new Database Schema for Custom List:
const listSchema=new mongoose.Schema({
    name: String,
    items:[itemsSchema]
});


// Create custom model based on the above schema

const List=mongoose.model("List",listSchema);


app.get('/',function(req,res)
{

    //Pass items form DataBase to EJS Templete File
    Item.find().then((docs)=>{

        if(docs.length===0)
        {
           // Put all of items in Database
            Item.insertMany(defaultItems);

            // What can we do when we want to see those data that is put into database when docs.length===0.So simply we redirect the route and then docs.length is not zero.
            res.redirect('/');
        }
        else{
            res.render('list',{listTitle:"Today",newListItems:docs});
        }

        
    })
});




// Create a route for Custom List:
app.get('/:customListName',function(req,res)
{
    const customListName=_.capitalize(req.params.customListName); // access to the custom variable.

    // Crate a new list and check  whether it is already in list or not
    List.findOne({name:customListName}).then(function(docs){
        if(!docs)
        {
            // if no list available then we create this new list based on customListName
            const list=new List({
                name:customListName,
                items:defaultItems
                //list.save() // Save list to the database.
            });

            list.save();
            res.redirect('/'+customListName);
        
        }
        else{

            // show an existing list.
            res.render('list',{listTitle:docs.name,newListItems:docs.items});

        }
    })
  
   
    
});

app.post('/',function(req,res)
{
   let itemName= req.body.newItem;  //it comes from input field newItem
   let listName=req.body.list;       // it comes from  button whcih variable name is list
   // Push item to Database.
   let item=new Item({
    name : itemName
   })


   if(listName==='Today')
   {
        item.save();
        res.redirect('/');
   }
   else
   {
        List.findOne({name:listName}).then(function(docs)
        {
            docs.items.push(item);
            docs.save();
            res.redirect('/'+listName)
        })
   }
   
});

// Delete item from Database

app.post('/delete',function(req,res)
{
   let checkItemsID=req.body.checkbox;
   let listName=req.body.listName;


   // Here write the code to delete item from specific route and for that we required the value of hidden input from list.ejs.And that value is stored in listItem.

   // This delete request is coming from Today List.
    if(listName==="Today")
    {
        Item.findByIdAndRemove(checkItemsID).then(function(){});
        res.redirect('/');
    }
    // This delete request is coming from the custom list.
    // Here the implementation step is :
    //1. First we check the listName 
    // 2. According to the list name we find the item through checkID and delete the item from the list.

    // And here is the complex thing is we find the item in items array we use the $pull operator to perform this task.And the working procedure of $pull is: it removes from an existing array all instances of a value or valus that match a specified condition. The structure of this along mongoDB is ModelName.findOneAndUpdate({condition},{updates},callback)  // Here the first one is the filter condition and the second one is which value we want to update and the third one is the callback which we noramlly shows as before.And the structure of the pull is {$pull:{array:{_id:value}}} and the short description is we pull from which array and what is the value of that array.

    
    else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkItemsID}} }).then(function(err,docs){
            res.redirect('/'+listName);
        })
    }
 
  // console.log(checkItemsID);

   // Delete from Database


   


   // The code written in below give chatGPT and it's working.
  //  async function removeItem() {
  //    try {
  //      const removedItem = await Item.findByIdAndRemove(checkItemsID);
       
  //      if (removedItem) {
  //        console.log('Successfully removed item:', removedItem);
  //      } else {
  //        console.log('No item found with the specified ID.');
  //      }
  //    } catch (err) {
  //      console.error('Error:', err);
  //    }
  //  }
   
  //  removeItem();


  
  
})


app.listen (3000,function(req,res)
{
    console.log('The server has started on port 3000');
})


// Express is not served up all the file in a project.Rather than it only serves up main access point.and also serves up views folder.And everything else it chooses to ignore.And for that reason,we need to create a folder called 'public'.Inside 'public' put css folder,javascript folder,images folder and we can tell express to serve up this public folder as a static resource.