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
			// Throws an error if the email is already taken
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


// Controller for user login
module.exports.loginUser = (reqBody) => {
	// Checks if the email provided exists on the database
	return User.findOne({email: reqBody.email}).then(result => {
		if (result == null) {
			// Throws an error if the email is incorrect or if it does not exists on the database
			return Promise.reject('Incorrect email address');
		} else {
			// If the email is correct, it will compare the password from the request body and the matching password on the database of the user
			const passwordConfirmed = bcrypt.compareSync(reqBody.password, result.password);

			// Checks if the password is correct based from the comparison above
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


// Controller for getting the profile/details of the current authenticated user
module.exports.getProfile = (data) => {
	// Finds the user using it's ID and return the necessary fields only
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
module.exports.addToCart = async (data) => {

	// Declare the variables needed for later use
	let price = [];
	let totalAmount = [];
	const newProduct = {
		products: data.order
	};
	
	// Loops through the request body to get the productId
	for (let orders of data.order) {
		await Product.findById(orders.productId).then((result, err) => {
			if (err) {
				console.error(err);
			} else {
				// Push the retrieved price of the products to the price array
				price.push(result.price);
			}
		});
	};

	// Computes the subtotal based from the quantity from the request body and the prices on the price array
	for (let ctr1 = 0, ctr = 0; ctr1 < price.length, ctr < data.order.length; ctr1++, ctr++) {
		totalAmount.push(newProduct.products[ctr].quantity * price[ctr1]);
	}
	// Add the computed totalAmount to the newProduct object
	newProduct.totalAmount = totalAmount.reduce((x, y) => x + y);

	// Find the authenticated user using it's userId
	return User.findById(data.userId).then((userResult, err) => {
		if (err) {
			console.error(err);
		} else {
			// Push the newProduct object to the orders array of the user
			userResult.orders.push(newProduct);

			// Save the changes on the user orders array
			return userResult.save().then((saveResult, err) => {
				if (err) {
					console.error(err);
				} else {
					const data = {
						message: "Items added to cart",
						result: userResult.orders.slice(-1)
					}
					return data;
				}
			});
		}
	});
}
// End of addToCart controller


// Controller for viewing the cart of the authenticated user
module.exports.viewCart = async (data) => {

	// Declare needed variable for later use
	const dataObj = {};

	// Find the authenticated user using it's userId
	await User.findById(data.userId).then((orderResult, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// Pass the user orders array to the dataObj to be used by other queries
			dataObj.cart = orderResult.orders;
		};	
	});

	// This object will store the final result
	const resultObj = {
		message: "My Shopping cart",
		cart: []
	};

	// Loops through the dataObj.cart array to get the details needed
	for (let ctr = 0; ctr < dataObj.cart.length; ctr++) {
		// Loop scoped object to store the details needed
		const productObj = {
			products: []
		};
		// Array to store the total amount
		let totalAmount = [];

		// Loops through the products array of the dataObj.cart array
		for (let ctr1 = 0; ctr1 < dataObj.cart[ctr].products.length; ctr1++) {
			// Find the products using the retrieved productId's from the products array
			await Product.findById(dataObj.cart[ctr].products[ctr1].productId).then((productResult, err) => {
				if (err) {
					console.error(err);
				} else  {
					// Computes the subtotal of each product
					let subtotals = dataObj.cart[ctr].products[ctr1].quantity * productResult.price;
					// Push all the subtotal to the totalAmount array
					totalAmount.push(subtotals);

					// Push a new object to the productObj.products array
					productObj.products.push(
						{
							productId: dataObj.cart[ctr].products[ctr1].productId, 
							name: productResult.name,
							quantity: dataObj.cart[ctr].products[ctr1].quantity,
							price: productResult.price,
							subtotal: subtotals,
							_id: dataObj.cart[ctr].products[ctr1]._id
						}
					);
				};
			});
		};

		// Set other details for the productObj
		productObj.totalAmount = totalAmount.reduce((x, y) => x + y);
		productObj.purchasedOn = dataObj.cart[ctr].purchasedOn;
		productObj.id = dataObj.cart[ctr]._id;
		// Push the created object to the resultObj
		resultObj.cart.push(productObj);

		// Updates the computed totalAmount of the order on the database
		await User.findById(data.userId).then((userResult, err) => {
			if (err) {
				console.error(err);
			} else {
				// Convert the two objectId's to string since comparing objectId's will always result to false
				let orderId = userResult.orders[ctr]._id.toString();
				let orderId_2 = dataObj.cart[ctr]._id.toString();

				if (orderId == orderId_2) {
					userResult.orders[ctr].totalAmount = totalAmount.reduce((x, y) => x + y);
					userResult.save().then((saveResult, err) => {
						if (err) {
							console.error(err);
						} else {
							console.log(saveResult);
						}
					});
				};
			};
		});
	};

	// Return the final result
	return resultObj;
};
// End of viewCart controller


// Controller for getting all the paid orders of the user
module.exports.getMyOrders = (data) => {
	// Query through all the products on the Product model to retrieve all orders using the userId of the user
	return Product.find({"order.userId": data.userId}, {isActive: 0, createdOn: 0, "order.userId": 0}).then((result, err) => {
		if (err) {
			console.error(err);
		} else {
			// Returns a message and the orders own by the user
			const data = {
				message: "Paid orders",
				orders: result
			}
			return data;
		}
	});
};
// End of getMyOrders controller


// Controller to remove an order from the cart
module.exports.removeOrderFromCart = (data) => {
	// Find the authenticated user using it's ID from the JSON web token
	return User.findById(data.userId).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// If the user is found, this will loop through the order array of the user to get the exact order matching the orderId provided from the request body
			for (let ctr = 0; ctr < result.orders.length; ctr++) {
				if(data.order.orderId == result.orders[ctr]._id) {

					// Get the index of the found order on the array and remove it from the array using splice
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
								message: "Items successfully removed from cart",
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


// Controller for removing a product from cart
module.exports.removeProductFromCart = (data) => {
	// Find the authenticated user using it's userId
	return User.findById(data.userId).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// If the user is found, this will loop through the order array of the user to get the exact product inside the products array matching the productOrderId provided from the request body
			for (let ctr = 0; ctr < result.orders.length; ctr++) {
				for (let ctr1 = 0; ctr1 < result.orders[ctr].products.length; ctr1++) {
					if(data.order.productOrderId == result.orders[ctr].products[ctr1]._id) {

						// Get the index of the found product on the array and remove it from the array using splice
						let index = result.orders[ctr].products.indexOf(result.orders[ctr].products[ctr1]);
						let spliceResult = result.orders[ctr].products.splice(index, 1);

						// Save changes on the products array of orders array
						return result.save().then((saveResult, err) => {
							if (err) {
								// Throws and error if the changes cannot be saved
								return Promise.reject("Failed to remove item");
							} else {
								// Returns the message and the removed product
								const data = {
									message: "Product successfully removed from cart",
									result: spliceResult
								};
								return data;
							};
						});
					
					} else {
						// Continue on the loop if the productOrderId from the request body and products array did not match
						continue;
					};
				}
			};
		};
	});
};
// End of removeProductFromCart controller


// Controller to update the quantity of the product
module.exports.updateOrderQuantity = (data) => {
	// Find the authenticated user using it's userId
	return User.findById(data.userId).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be found on the database
			return Promise.reject(err);
		} else {
			// If the user is found, this will loop through the products array of the orders array to get the exact product matching the productOrderId provided from the request body
			for (let counter = 0; counter < result.orders.length; counter++) {
				for (let ctr = 0; ctr < result.orders[counter].products.length; ctr++) {
					if (data.order.orderId == result.orders[counter].products[ctr]._id) {

						// Updates the quantity of the product based on the quantity provided from the request body
						result.orders[counter].products[ctr].quantity = data.order.quantity;

						// Save the changes on the products array of the orders array
						return result.save().then((saveResult, err) => {
							if (err) {
								// Throws and error if the changes cannot be saved
								return Promise.reject("Failed to update quantity");
							} else {
								// Returns the message and the updated product
								const data = {
									message: "Quantity successfully updated",
									result: result.orders[counter].products[ctr]
								};
								return data;
							};
						});

					} else {
						// Continue on the loop if the productOrderId from the request body and products array did not match
						continue;
					};	
				};
			}; 
		};
	});
};
// End of updateOrderQuantity controller


// Controller for checking out an item from the cart
/*module.exports.checkOutOrder = (data) => {
	// Find the authenticated user using it's ID from the JSON web token
	return User.findById(data.userId).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be find on the database
			return Promise.reject(err);
		} else {
			// This block will run if there is only one order to checkout
			if (data.order.length === undefined) {

				// This will loop through the order array of the user and mark the matched order as paid
				for (let ctr = 0; ctr < result.orders.length; ctr++) {

					if(data.order.orderId == result.orders[ctr]._id) {

						for (let counter = 0; counter < result.orders[ctr].products.length; counter++) {

							return Product.findById(result.orders[ctr].products[counter].productId).then((productResult, err) => {
								if (err) {
									console.error(err);
								} else {
									let newProductOrder = {
										orderId: result.orders[ctr]._id,
										userId: data.userId,
										quantity: result.orders[ctr].products[counter].quantity
									}

									productResult.order.push(newProductOrder);

									return productResult.save().then((productSaveResult, err) => {
										if (err) {
											console.error(err);
										} else {

											let index = result.orders.indexOf(result.orders[ctr]);
											let spliceResult = result.orders.splice(index, 1);

											// Save the changes on the orders array
											return result.save().then((userSaveResult, err) => {
												if (err) {
													// Throws and error if the changes cannot be saved
													return Promise.reject("Failed to checkout");
												} else {
													const data = {
														message: "Items successfully checkout"
													};
													data.result = spliceResult;
													return data;
												};
											});
										};
									}); 
								};
							});
						};
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
};*/
// End of checkOutOrder controller


// Controller for checking out an order
module.exports.checkOutOrder = async (data) => {

	// Declare needed variables for later use
	let orderId;
	let orderDetails = [];

	// Find the authenticated user using it's userId
	await User.findById(data.userId).then((result, err) => {
		if (err) {
			// Throws an error if the user cannot be found on the database
			return Promise.reject(err);
		} else {
			// This will loop through the orders array of the user
			for (let ctr = 0; ctr < result.orders.length; ctr++) {
				// Checks if the orderId from the request body and orderId from the users orders array matched
				if(data.order.orderId == result.orders[ctr]._id) {
					for (let counter = 0; counter < result.orders[ctr].products.length; counter++) {
						// Assign the retrieved orderId to the orderId variable to be use by other queries
						orderId = result.orders[ctr]._id;

						// Push the order details to the orderDetails array to be use by other queries
						orderDetails.push(result.orders[ctr].products[counter]);
					};
				} else {
					// Continue on the loop if the orderId from the request body and orders array did not match
					continue;
				};
			};
		};
	});

	// This object will contain the final result
	const dataResult = {};

	// Loops through the orderDetails array
	for (order of orderDetails) {
		// Finds the product on the Product model using the productId's from the orderDetails array
		await Product.findById(order.productId).then((productResult, err) => {
			if (err) {
				console.log(err);
			} else {
				// Create a newProductOrder object to be push on the order array of the identified product
				let newProductOrder = {
					orderId: orderId,
					userId: data.userId,
					quantity: order.quantity
				}

				// Push the newProductOrder to the order array
				productResult.order.push(newProductOrder);

				// Save the changes on the order array of the product
				productResult.save().then((productSaveResult, err) => {
					if (err) {
						console.error(err);
					} else {
						// Adds a message to the dataResult object
						dataResult.message = "Items successfully checkout";
					}
				});
			}
		});
	};

	// Find the authenticated user using it's userId
	await User.findById(data.userId).then((userResult, err) => {
		if (err) {
			// Throws an error if the user cannot be found on the database
			return Promise.reject(err);
		} else {
			// This will loop through the orders array of the user
			for (let ctr = 0; ctr < userResult.orders.length; ctr++) {
				// Checks if the orderId from the request body and orderId from the users orders array matched
				if (data.order.orderId == userResult.orders[ctr]._id) {

					// Get the index of the identified order and remove it from the array using splice
					let index = userResult.orders.indexOf(userResult.orders[ctr]);
					let spliceResult = userResult.orders.splice(index, 1);

					// Save the changes on the orders array
					return userResult.save().then((userSaveResult, err) => {
						if (err) {
							// Throws and error if the changes cannot be saved
							return Promise.reject("Failed to checkout");
						} else {
							// Adds the removed/checkout order to the dataResult object
							dataResult.result = spliceResult;
						};
					});
				};
			};
		};
	});

	// Returns the dataResult object
	return dataResult;
};
// End of checkOutOrder controller


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
