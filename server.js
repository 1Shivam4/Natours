const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');
const app = require('./app.js');

// uncaught exception errors handled here at the top level code
// This will help us to find and detect the uncaught exceptions e.g. declearing a variable before defining it
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION : Sutting down');
  console.log(err);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// this is the hosted database version
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('DB Connection successful');
    // console.log(con.connections);
  });
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('Listening on port 3000');
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION : Shutting down....');
  server.close(() => {
    process.exit(1);
  });
});
