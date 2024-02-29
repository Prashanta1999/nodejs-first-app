import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import  Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
})
.then(() =>console.log("Database connected"))
.catch(() => console.log("not connected"));

const userScema= new mongoose.Schema({
    name:String,
    email:String,
    password:String,
})
const User = mongoose.model("User",userScema);


const app = express();

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");


const isAuthencated = async (req, res,next) => {
    const {token} = req.cookies; 
     
    if(token){
        const decoded = Jwt.verify(token,"psksdfjkfjhdhfbh"); 
        req.user= await User.findById(decoded._id);
        next();
     } 

    else{
        res.redirect("/login");
    }
     
}

    app.get('/',isAuthencated, (req, res) => {
           
            res.render("logout",{name:req.user.name});
        })
    app.get("/login",(req, res) => {
        res.render("login");
    })

        app.get('/register', (req, res) => {
            res.render("register");
        })

        app.post("/login",async(req,res)=>{
            const {email,password} = req.body;

            let user = await User.findOne({email});

            if(!user) return res.redirect("/register")

            const isMatch = await bcrypt.compare(password,user.password);

            if(!isMatch) return res.render("login",{ email, message: "Incorrect password" });

                
        const token = Jwt.sign({_id: user._id}, "psksdfjkfjhdhfbh");

        res.cookie("token",token,{
        httpOnly:true,
        expires: new Date(Date.now() + 60 * 1000),
        });
        res.redirect("/");

        })
        

    app.post("/register", async(req,res)=>{
        const {name,email,password} = req.body;

        let user = await User.findOne({email})
        if(user){
            return res.redirect("/login");
        }

            const hashpassword= await  bcrypt.hash(password,10);

        user = await User.create({
            name,
            email,
            password: hashpassword,
        });

        const token = Jwt.sign({_id: user._id}, "psksdfjkfjhdhfbh");

        res.cookie("token",token,{
        httpOnly:true,
        expires: new Date(Date.now() + 60 * 1000),
        });
        res.redirect("/")
    })

    app.get("/logout",(req,res)=>{
        res.cookie("token",null,{
        httpOnly:true,
        expires: new Date(Date.now()),
        })
        res.redirect("/")
    })






app.listen(5000,()=>{
    console.log("server is working");
    
})