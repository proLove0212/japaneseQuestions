//.env for storing things that should be secret, like API keys
require("dotenv").config();

//basic 3 needed in every project
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//mongoose for database stuff
const mongoose = require("mongoose");

//bcrypt for local authentication
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));

//change this connection string for particular database
mongoose.connect("mongodb://localhost:27017/japaneseQuestionsDB");

//schema for questions in the database
const questionSchema = new mongoose.Schema({
    jpn: {
        type: String,
        required: true,
        unique: true
    },
    furigana: String,
    romaji: String,
    eng: String,
    level: Number
});

//create question document (table) in database
const Question = new mongoose.model("Question",questionSchema);

//create some sample questions to get our database rolling
const yourName = new Question({
    jpn: "あなたの名前はなんですか？",
    furigana: "あなたのなまえはなんですか？",
    romaji: "Anata no namae wa nan desu ka?",
    eng: "What is you name?",
    level: 5
});

const yourBday = new Question({
    jpn: "あなたの誕生日はいつですか？",
    furigana: "あなたのたんじょうびはいつですか？",
    romaji: "Anata no tanjoubi wa itsu desu ka?",
    eng: "When is your birthday?",
    level: 5
});

const youHungry = new Question({
    jpn: "お腹が空いていますか？",
    furigana: "あなかがついていますか？",
    romaji: "Onaka ga tsuite imasu ka?",
    eng: "Are you hungry?",
    level: 5
});

const uniformQ = new Question({
    jpn: "あなたの学校時代は制服を着ましたか？ 学校の服のルールはどうと思いますか?",
    eng: "Did you wear a uniform when you were in school.  What do you think about shcools requiring uniforms?",
    level: 2
});

const defaultQuestions = [yourName, yourBday, youHungry, uniformQ];



//schema for users in the database
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

//create user doccument (table) in database
const User = new mongoose.model("User",userSchema);



//every time the home page is loaded, display a random question
app.get("/",function(req,res){
    Question.find({},function(err,results){
        let question = "no questions found";
        if(err){
            console.log(err);
        }else{
            const randIndex = Math.floor(Math.random()*results.length);
            question = results[randIndex].jpn;
            console.log(question);
        }
    
        res.render("home", {randomQuesiton: question});
    });
});

//basic get for login page
app.get("/login",function(req,res){
    res.render("login");
});

//post for login page - need to get a username and password and check the user table in the database
app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username},function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                bcrypt.compare(password, foundUser.password, function(err,result){
                    if(result === true){
                        res.render("secrets");
                    }
                });
            }
        }
    })
});

//basic get for register page
app.get("/register",function(req,res){
    res.render("register");
});


//post for regiser page - get username and password for user, salt, then put into database
//TODO - logic to prevent duplicate usernames
app.post("/register",function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err,hash){
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
    
        newUser.save(function(err){
            if(!err){
                res.render("secrets");
            }else{
                console.log(err);
            }
        });
    });
    
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function(){
      //if there are no questions in the table, insert a few
      Question.find({},function(findErr,results){
        if(findErr){
            console.log(findErr);
        }else if (results.length <= 0){
            Question.insertMany(defaultQuestions,function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("inserted default questions b/c current question database is empty");
                }
            });
        }
    });
    console.log("server started");
});
