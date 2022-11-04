// Setup the dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Server setup
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Import routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");

// Database connection
mongoose.connect("mongodb+srv://admin123:admin123@project0.kch4thl.mongodb.net/capstone-2-bautista?retryWrites=true&w=majority", 
	{
		useNewUrlParser: true,
		useUnifiedTopology: true
	}
);

mongoose.connection.once("open", () => console.log("Now connected to MongoDB Atlas"));
mongoose.connection.on("error", () => console.log("Connection error"));

// Declare the routes
app.use("/users", userRoutes);
app.use("/products", productRoutes);

// Listen to the port declared and provide a success message
app.listen(process.env.PORT || 4000, () => {
	console.log(`API is now online on port ${process.env.PORT || 4000}`);
});