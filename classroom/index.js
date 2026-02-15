const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");


app.use(cookieParser("secretcode"));

app.get("/getsignedcookie", (req, res) => {
    res.cookie("color", "red", {signed: true});
    res.send("done!");
})

app.get("/verify", (req, res) => {
    console.log(req.signedCookies);
    res.send("verify");
})

app.get("/greet", (req, res) => {
    let {name = "anonymous"} = req.cookies;
    res.send(`hi, ${name}`);
})

app.listen(3000, () => {
    console.log("app is listening on port 3000");
});

app.get("/", (req, res) => {
    console.dir(req.cookies);
    res.send("this is home page");
})

app.get("/prahans", (req, res) => {
    res.send("hello world");
})

app.get("/apple", (req, res) => {
    res.send("hi i am apple");
})

app.get("/getcookies", (req, res) => {
    res.cookie("greet", "hello");
    res.cookie("origin", "nepal");
    res.send("we sent you a cookie!");
})