//jshint esversion:6
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
const session=require("express-session");                       // PP
const passport=require("passport");                             // PP
const passportLocalMongoose=require("passport-local-mongoose"); // PP
const app=express();

var currUser;
var questionsAndAnswers=[];
var userArray=[];
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));
mongoose.set('useCreateIndex', true);

app.use(session({                                               // PP
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/manitoraDB",{useNewUrlParser:true,useUnifiedTopology:true});

const userSchema=new mongoose.Schema(
  {
    username:String,
    name:String,
    branch:String,
    year:String,
    college:String,
    password:String
  });

  userSchema.plugin(passportLocalMongoose);

const User=mongoose.model("User",userSchema);
const questAndAnswerSchema=new mongoose.Schema({
  email:String,
  quest:String,
  postedBy: userSchema,
  answer:[String]
});


const Question=mongoose.model("Question",questAndAnswerSchema);

passport.use(User.createStrategy());                     // PP

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){

  res.render("login");
});
app.get("/signup",function(req,res){
  res.render("signup");
});

app.get("/discussion",function(req,res){

  if(req.isAuthenticated()){
    Question.find({},function(err,questions){
      if(err){
        console.log(err);
      } else {
        res.render("discussion",{questions:questions});
      }
    });
  }else{
    res.redirect("/login");
  }
});
app.get("/ask",function(req,res){
  if(req.isAuthenticated()){
      res.render("ask");
  }else{
    res.redirect("/login");
  }
});


app.post("/signup",function(req,res){
  User.register({
    username:req.body.username,
    name:req.body.name,
    branch:req.body.branch,
    year:req.body.year,
    college:req.body.college
  },req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/signup");
    } else{
      passport.authenticate("local")(req,res,function(){
        User.findOne({'username':req.body.username},function(err,foundUser){
          currUser=foundUser;
          //console.log(currUser);
        });
        res.redirect("/discussion");
      });

    }
  });
});


app.post("/login",function(req,res){
  const user= new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
      res.redirect("login");
    } else{
      passport.authenticate("local")(req,res,function(){
        User.findOne({'username':req.body.username},function(err,foundUser){
          currUser=foundUser;
          //console.log(currUser);
        });
        res.redirect("/discussion");
      });
    }
  });
});


app.post("/ask",function(req,res){
  //console.log(req.body.quest);
  const newQuest=new Question({
    postedBy:currUser,
    quest:req.body.quest
  });
  newQuest.save();
  res.redirect("/discussion");
});


app.listen(3000,function(req,res) {
  console.log("Server started at port 3000");
});
