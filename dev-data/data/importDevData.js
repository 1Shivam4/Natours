const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel.js');
const Review = require('../../models/reviewsModel.js');
const User = require('../../models/userModel.js');

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// this is the hosted database version
mongoose.connect(db).then(con => {
  console.log('DB Connection successful');
  // console.log(con.connections);
});

// Reading the file using the file system module
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// Import data into database
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded');
    process.exit();
  } catch (e) {
    console.log(e);
  }
};

// DElETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('DB Successfully deleted');
    process.exit();
    // This is an aggressive approach to exit the application so use it properly
  } catch (e) {
    console.log(e);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);

// This file is to import and delete the entire database data from using the command line
// go to your lecture number 94 of your course and see the notes to find the
// desired method
