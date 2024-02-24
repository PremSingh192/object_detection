require("dotenv").config();
const express = require("express");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");




const sampleUsers = [
  {
    name: "Prem Singh",
    email: "prem@gmail.com",
    password: bcrypt.hashSync("123456"),
  },
  {
    name: "Cherish Patel",
    email: "cherish@gmail.com",
    password: bcrypt.hashSync("123456"),
  },
];

function generateToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
}
function isAuth  (req, res, next)  {
    const authorization = req.headers.authorization;
    if (authorization) {
      const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
      jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
        if (err) {
          res.status(401).send({ message: 'Invalid Token' });
        } else {
          req.user = decode;
          next();
        }
      });
    } else {
      res.status(401).send({ message: 'No Token' });
    }
  };

userRouter.get("/", (req, res) => {
  console.log("inside user router ");
  res.json({ mesage: `connected to userRouter` });
});

userRouter.get(
  "/seeduser",
  asyncHandler(async (req, res) => {
    console.log("inside seed user  ");

    await User.deleteMany({});

    const createdUsers = await User.insertMany(sampleUsers);
    if (createdUsers) {
      res.json({ message: "user inserted succesfully" });
    } else {
      res.json({ message: "failed to insert users" });
    }
  })
);

userRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.json({ access: generateToken(user) });
      } else {
        res.status(401).json({ message: "password invalid " });
      }
    } else {
      res.status(401).json({ message: "user not found " });
    }
  })
);


userRouter.post("/isAuth",isAuth,(req,res)=>{

    res.json({"message":true})

})
module.exports = userRouter;
