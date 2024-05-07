const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require("path");
const User = require('./model/User');

// Middleware
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views" , path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));


// Database connection
main().then(() => { console.log("Database connected successfully"); })
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}


app.post('/signup/now', async (req, res) => {
  try {
    // Accessing form data from the request body
    const { username, email, password, name, profilePicture } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      name,
      profilePicture,
    });

    // Save the new user to the database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Send success response along with token
    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    // Handle errors
    console.error('Error during user creation:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post("/login/now", async (req, res) => {
  try {
    // Accessing form data from the request body
    const { username, email, password } = req.body;
    // Find the user by username or email
    const existingUser = await User.findOne( { email } );
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (passwordMatch) {
      return res.status(200).json({ message: 'Login successful' });
    } else {
      return res.status(401).json({ message: 'Incorrect username, email, or password' });
    }
  } catch (error) {
    // Handle errors
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.get("/login",(req,res)=>{
  res.render("login.ejs");
})


// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/",(req,res)=>{
  res.render("signup.ejs");
});
