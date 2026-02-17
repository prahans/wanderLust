const mongoose = require('mongoose');
const initData = require("./data.js");
const Listing = require("../models/Listing.js");

main()
.then(res => console.log("connected to DB"))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: '699425d34cb3d8f78eb993f6'}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
}

initDB();

