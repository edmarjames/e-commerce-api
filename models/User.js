// Import dependencies
const mongoose = require("mongoose");

// Schema for User
const userSchema = new mongoose.Schema({
	firstName: {
		type: String,
		required: [true, "First name is required"]
	},
	lastName: {
		type: String,
		required: [true, "Last name is required"]
	},
	email: {
		type: String,
		required: [true, "Email is required"]
	},
	password: {
		type: String,
		required: [true, "Password is required"]
	},
	mobileNo: {
		type: String,
		required: [true, "Mobile number is required"]
	},
	isAdmin: {
		type: Boolean,
		default: false
	},
	orders: [
		{
			products: [
				{
					productId: {
						type: String,
						required: [true, "Product ID is required"]
					},
					/*productName: {
						type: String,
						required: [true, "Product name is required"]	
					},*/
					quantity: {
						type: Number,
						required: [true, "quantity is required"]
					}
				}
			],
			totalAmount: {
				type: Number,
				required: [true, "Total amount is required"]
			},
			purchasedOn: {
				type: Date,
				default: new Date()
			}
		}
	]
});

module.exports = mongoose.model("User", userSchema);