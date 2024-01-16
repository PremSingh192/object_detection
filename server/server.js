require("dotenv").config();

const userRouter = require("./router/userRouter.js")
const express = require("express");
const mongoose= require("mongoose");
const cors = require("cors");
const app = express();


mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("connected to db");
  }).catch((err) => {
    console.log(err.message);
  });

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

app.get("/",(req,res)=>{
    res.status(201).json({"message":"connected succesfully"})
})

// app.get("/logo",(req,res)=>{
//     res.sendFile(__dirname+"/static/image1.png")
// })
// app.get("/model",(req,res)=>{
//   res.sendFile(__dirname+"/static/model.json")
// })
// app.get("/weight",(req,res)=>{
//   res.send(__dirname+"/static/weights.bin")
// })
app.use("/api/user",userRouter)








  const port = process.env.PORT || 8000;

  app.listen(port, (err) => {
   if(err)console.log(`failed to run ${err}`);
   console.log(`http://localhost:${port}`)
  });