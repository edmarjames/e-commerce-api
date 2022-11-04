// Import the model
const User = require("../models/User");
const Product = require("../models/Product");

// Import dependencies
const bcrypt = require("bcrypt");
const auth = require("../auth");


// Controller for registering a user
module.exports.registerUser = (reqBody) => {
	// Checks if the email provided on the request body already exists on the database
	return User.find({email: reqBody.email}).then(result => {
		if (result.length > 0) {
			// Throws an error if the username is already taken
			return Promise.reject("This email address is already taken!");
		} else {
			// Creates a new user from the request body
			let newUser = new User({
				firstName: reqBody.firstName,
				lastName: reqBody.lastName,
				email: reqBody.email,
				password: bcrypt.hashSync(reqBody.password, 10),
				mobileNo: reqBody.mobileNo
			});

			// Save the new user to the database
			return newUser.save().then((result, err) => {
				if (err) {
					console.error(err);
				} else {
					return Promise.resolve("Successfully Registered!");
				};
			});
		};
	});
};
// End of registerUser controller


// Controller for login
module.exports.loginUser = (reqBody) => {
	// Checks if the username provided exists on the database
	return User.findOne({email: reqBody.email}).then(result => {
		if (result == null) {
			// Throws an error if the email is incorrect or if it does not exists on the database
			return Promise.reject('Incorrect email address');
		} else {
			// If the email is correct, it will compare the password from the request body and the matching password on the database of the user
			const passwordConfirmed = bcrypt.compareSync(reqBody.password, result.password);

			if (passwordConfirmed) {
				// Provides a message and the JSON web token once password is correct
				const data = {
					message: "You have successfully log in!",
					token: {access: auth.createAccessToken(result)}
				}
				return data;
			} else {
				// Throws an error if the password did not match
				return Promise.reject("Incorrect password!");
			};
		};
	});
};
// End of loginUser controller


// Controller for fetching the profile of the current authenticated user
module.exports.getProfile = (data) => {
	// Finds the user using it's ID and limit the fields returned using field projection
	return User.findById({_id: data.userId}, {_id: 0, password: 0, isAdmin: 0, orders: 0}).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be found on the database
			return Promise.reject(err);
		} else {
			// Returns the message and the profile of the authenticated user
			const data = {
				message: "My profile",
				details: result
			}
			return data;
		}
	});
};
// End of getProfile controller


// Controller for adding a product to the cart
module.exports.addToCart = (data) => {

	// Find the product details using it's ID
	return Product.findById(data.order.productId).then((productResult, err) => {
		if (err) {
			// Throws an error if the product does not exists on the database
			// console.log("check");
			return Promise.reject("Product does not exists");
		} else {
			// Checks if the product is active
			if (productResult.isActive === false) {
				return Promise.reject("Product is out of stock!");
			} else {
				// Create a new order based from the request body. Product name will be auto populated based from the first query on the products collection
				let productObj = {
						productId: data.order.productId,
						productName: productResult.name,
						quantity: data.order.quantity	
				};
				const newProduct = {
					products: [],
					totalAmount: (productResult.price * data.order.quantity)
				};
				newProduct.products.push(productObj);
				console.log(newProduct);

				// Finds the authenticated user using it's ID and filter the necessary fields only
				return User.findById({_id: data.userId}, {email: 0, password: 0, isAdmin: 0, mobileNo: 0}).then((user, err) => {
					if (err) {
						// Throws an error if the user cannot be find on the database
						console.error(err);
					} else {
						// Push the new order to the order array on the user collection
						user.orders.push(newProduct);
					
						// Save the changes on the order array of the user
						return user.save().then((orderResult, err) => {
							if (err) {
								// Throws an error if changes cannot be saved
								console.error(err);
							} else {
								// Returns the message and the added product
								const data = {
									message: "Product is added to your cart",
									details: orderResult
								}
								return data;
							};
						});
					};
				});
			};
		};
	});
};
// End of addToCart controller


// Controller for viewing the cart of the authenticated user
module.exports.viewCart = (data) => {

	// Find the authenticated user using it's ID from the JSON web token
	return User.findById(data.userId).then((orderResult, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// If the user exists, it will return all unpaid orders
			const data = {
				message: "My shopping cart",
				cart: orderResult.orders
			};
			
			let grandTotal = [];
			for (let ctr = 0; ctr < orderResult.orders.length; ctr++) {
				grandTotal.push(orderResult.orders[ctr].totalAmount);
			};

			// adds the Grand total to the data object
			data.grandTotal = grandTotal.reduce((x, y) => x + y);
			// returns the data object
			return data;
		};			
	});
};
// End of viewCart controller


// Controller for viewing the order history of the authenticated user
module.exports.getPaidOrders = (data) => {
	// Find the authenticated user using it's ID from the JSON web token
	return User.findById(data.userId).then((orderResult, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// If the user exists, it will return all paid orders
			const data = {
				message: "Order History",
				name: `${orderResult.firstName} ${orderResult.lastName}`,
				transaction: []
			};

			// Logic to get the subtotal of orders and the total amount of all orders
			const total = [];
			for (let ctr = 0; ctr < orderResult.order.length; ctr++) {
				if (orderResult.order[ctr].isPaid == true) {
					let subtotals = (orderResult.order[ctr].price * orderResult.order[ctr].quantity);
					data.transaction.push({orders: orderResult.order[ctr], subtotal: subtotals});
					total.push(subtotals);
				} else {
					continue;
				}
			};

			// adds the total to the data array
			data.total = total.reduce((x, y) => x + y);
			// returns the data object
			return data;
		}			
	});
};
// End of getPaidOrders controller


// Controller to remove an order from the cart
module.exports.removeOrderFromCart = (data) => {
	// Find the authenticated user using it's ID from the JSON web token
	return User.findById(data.userId).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// If the user is found, this will loop through the order array of the user to get the exact order matching the orderId provided from the request body
			// Get the index of the found order on the array and remove it from the array using splice
			for (let ctr = 0; ctr < result.orders.length; ctr++) {
				if(data.order.orderId == result.orders[ctr]._id) {
					let index = result.orders.indexOf(result.orders[ctr]);
					let spliceResult = result.orders.splice(index, 1);

					// Save changes on the order array
					return result.save().then((saveResult, err) => {
						if (err) {
							// Throws and error if the changes cannot be saved
							return Promise.reject("Failed to remove item");
						} else {
							// Returns the message and the removed order
							const data = {
								message: "Item successfully removed from cart",
								result: spliceResult
							};
							return data;
						};
					});
					
				} else {
					// Continue on the loop if the orderId from the request body and order array did not match
					continue;
				};
			};
		};
	});
};
// End of removeOrderfromCart controller


// Controller to update the quantity of the order
module.exports.updateOrderQuantity = (data) => {
	// Find the authenticated user using it's ID from the JSON web token
	return User.findById(data.userId).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// If the user is found, this will loop through the order array of the user to get the exact order matching the orderId provided from the request body
			// Updates the quantity of the order based on the quantity provided from the request body
			for (let ctr = 0; ctr < result.orders.length; ctr++) {
				if(data.order.orderId == result.orders[ctr]._id) {
					console.log(data.order.orderId);
					console.log(result.orders[ctr]._id);
					result.orders[ctr].products[ctr].quantity = data.order.quantity;
					return Product.findOne({name: result.orders[ctr].products[ctr].productName}).then((productResult, err) => {
						if (err) {
							console.error(err);
						} else {
							result.orders[ctr].totalAmount = (data.order.quantity * productResult.price);
						}

						// Save changes on the order array
						return result.save().then((saveResult, err) => {
							if (err) {
								// Throws and error if the changes cannot be saved
								return Promise.reject("Failed to update quantity");
							} else {
								// Returns the message and the updated order
								const data = {
									message: "Quantity successfully updated",
									result: result.orders[ctr]
								};
								return data;
							};
						});
					});
				} else {
					// Continue on the loop if the orderId from the request body and order array did not match
					continue;
				};
			};
		};
	});
};
// End of updateOrderQuantity controller


// Controller for checking out an item from the cart
module.exports.checkOutOrder = (data) => {
	// Find the authenticated user using it's ID from the JSON web token
	return User.findById(data.userId).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// This block will run if there is only one order to checkout
			if (data.order.length === undefined) {

				// This will loop through the order array of the user and mark the matched order as paid
				for (let ctr = 0; ctr < result.order.length; ctr++) {
					if(data.order.orderId == result.order[ctr]._id) {
						result.order[ctr].isPaid = true;

						// Save the changes on the order array
						return result.save().then((saveResult, err) => {
							if (err) {
								// Throws and error if the changes cannot be saved
								return Promise.reject("Failed to checkout");
							} else {
								// Create a data object to store all the results
								const data = {
									message: "Items successfully checkout",
									result: result.order[ctr]
								}

								// Logic for getting the total amount of order
								let subtotals = (result.order[ctr].price * result.order[ctr].quantity);
								data.total = subtotals;

								// Returns the message and the orders paid successfully
								return data;
							};
						});
					} else {
						// Continue on the loop if the orderId from the request body and order array did not match
						continue;
					};
				};

			// This block will run if there are multiple orders to checkout
			} else {
				// This will loop through the order array of the user and mark the matched order as paid
				let ctr1;
				for (let ctr = 0, ctr1 = 0; ctr < result.order.length, ctr1 < data.order.length; ctr++, ctr1++) {
					if (data.order[ctr1].orderId == result.order[ctr]._id) {
						result.order[ctr].isPaid = true;
					} else {
						continue;
					}
				};

				// Save the changes on the order array
				const end = data.order.length;
				return result.save().then((saveResult, err) => {
					if (err) {
						// Throws an error if changes cannot be saved
						return Promise.reject("Failed to checkout");
					} else {
						// Create a total array to store the total amount of paid orders and data object to store all the results
						const total = [];
						const data = {
							message: "Items successfully checkout",
							receipt: []
						};

						// Logic for getting the subtotal of the orders and total amount of all orders
						for (let ctr = 0; ctr < end; ctr++) {
							let subtotals = (result.order[ctr].price * result.order[ctr].quantity);
							data.receipt.push({orders: result.order[ctr], subtotal: subtotals});
							total.push(subtotals);
						};

						// Adds the total amount to the data object
						data.total = total.reduce((x, y) => x + y);
						// Returns the data object
						return data;
					}
				});
			};
		};
	});

};
// End of checkOutOrder controller


// Controller for getting all orders
module.exports.getAllOrders = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Get all the users and filter the necessary fields
		return User.find({isAdmin: false}, {email: 1, orders: 1}).then((searchResult, err) => {
			if (err) {
				console.error(err);
			} else {
				// Returns the message and orders of all users
				const data = {
					message: "All orders",
					result: searchResult
				}
				return data;
			}
		});
	} else {
		// Throws an error if the user is not an admin
		return Promise.reject("You are not allowed to access this feature!");
	}
};
// End of getAllOrders controller


// Controller to get all users
module.exports.getAllUsers = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Get all the users and filter the necessary fields
		return User.find({}, {password: 0, orders: 0}).then((result, err) => {
			if (err) {
				console.error(err);
			} else {
				// Returns the message and all users
				const data = {
					message: "All users",
					details: result
				};
				return data;
			}
		});
	} else {
		// Throws an error if the user is not an admin
		return Promise.reject("You are not allowed to access this feature!");
	}
};
// End of getAllUsers controller


// Controller for setting a user as admin
module.exports.setUserAsAdmin = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Finds the user using it's userId and filter the necessary fields
		return User.findById({_id: data.user.userId}, {password: 0, orders: 0}).then((result, err) => {
			if (err) {
				// Throws an error if the user does not exists
				return Promise.reject("User does not exists!");
			} else {
				// If the user is found, set the isAdmin to true
				result.isAdmin = true;

				// Save the changes
				return result.save().then((saveResult, err) => {
					if (err) {
						return Promise.reject("Cannot save changes");
					} else {
						// Returns the message and the updated user
						const data = {
							message: "Successfully set user as admin",
							result: saveResult
						};
						return data;
					};
				});
			};
		});
	} else {
		// Throws an error if the user is not an admin
		return Promise.reject("You are not allowed to access this feature!");
	};
};
// End of setUserAsAdmin controller