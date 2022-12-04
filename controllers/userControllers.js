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
			const errorMessage = {
				message: "Registration failed: email address is already taken"
			}
			return Promise.reject(errorMessage);
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
					const data = {
						message: "Successfully Registered!",
						result: result
					}
					return data;
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
			const incorrectEmail = {
				message: "Login failed: incorrect email address"
			}
			// Throws an error if the email is incorrect or if it does not exists on the database
			return Promise.reject(incorrectEmail);
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
				const incorrectPassword = {
					message: "Login failed: incorrect password"
				}
				// Throws an error if the password did not match
				return Promise.reject(incorrectPassword);
			};
		};
	});
};
// End of loginUser controller


// Controller for getting the profile/details of the current authenticated user
module.exports.getProfile = (data) => {
	// Finds the user using it's ID and return the necessary fields only
	return User.findById({_id: data.userId}, {password: 0, orders: 0}).then((result) => {
		// Returns the message and the profile of the authenticated user
		const data = {
			message: "My profile",
			details: result
		}
		return data;
	});
};
// End of getProfile controller

module.exports.changePassword = (data) => {
	// Checks if the user is an admin
	if (data.isAdmin) {
		// provides error message if the user is an admin
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If not, proceed with the operation
	} else {
		return User.findById(data.userId).then(result => {
			// checks if the password from the database and request body matches
			const passwordConfirmed = bcrypt.compareSync(data.reqBody.oldPassword, result.password);

			// If it matches, it updates the password based from the request body new password and encrypt it using bcrypt
			if (passwordConfirmed) {
				result.password = bcrypt.hashSync(data.reqBody.newPassword, 10);
				return result.save().then((saveResult, err) => {
					if (err) {
						console.error(err);
					} else {
						const passwordUpdated = {
							message: "Your password is now updated"
						}
						return passwordUpdated;
					}
				});

			// If the password from the database and request body matches it will provide an error message
			} else {
				const passwordNotMatch = {
					message: "Operation failed: old password did not match"
				}
				return Promise.reject(passwordNotMatch);
			};
		});
	};
};

// Controller for creating an order and checks out automatically
module.exports.createOrder = async (data) => {
	if (data.isAdmin) {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If user is non-admin, proceed with the operations
	} else {
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

		// This will contain the final result
		const dataResult = {
			message: "Order created"
		};
		// Declare variable for later use
		let reverseOrder;

		// Find the authenticated user using it's userId
		await User.findById(data.userId).then((userResult, err) => {
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
						// Add the created order on the dataResult object
						dataResult.result = userResult.orders.slice(-1);

						// Pass the orders array of the user in reverse order
						reverseOrder = userResult.orders.reverse();
					}
				});
			};
		});

		// Gets the orderId of the recently added order
		let orderId = reverseOrder[0]._id;

		// Loops through the request body
		for (order of data.order) {
			// Finds the product on the Product model using the productId's from the request body array
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
							// dataResult.order = orderDetails;		
						}
					});
				};
			});
		};

		// Return the dataResult object
		return dataResult;
	};
};
// End of createOrder controller

// Controller for adding a product to the cart
module.exports.addToCart = async (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If user is non-admin, proceed with the operations
	} else {
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
				return Promise.reject(err);
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
			};
		});
	};
};
// End of addToCart controller


// Controller for viewing the cart of the authenticated user
module.exports.viewCart = async (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If user is non-admin, proceed with the operations
	} else {
		// This will store the orderId's from the Product model
		const orderId = [];

		// Collect all the orderId of every order from Product model
		await Product.find({"order.userId": data.userId}).then((result, err) => {
			if (err) {
				console.log(err);
			} else {
				for (let ctr = 0; ctr < result.length; ctr++) {
					for (let ctr1 = 0; ctr1 < result[ctr].order.length; ctr1++) {
						// Push all the orderId to the orderId array to be use by other queries
						orderId.push(result[ctr].order[ctr1].orderId);		
					};
				};
			};
		});

		// This will only filter unique orderIds
		let uniqueElements = orderId.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		// This will contain the filtered orders
		const dataObj = {
			cart: []
		};

		// Find the authenticated user using it's userId
		await User.findById(data.userId).then((orderResult, err) => {
			if (err) {
				// Throws an error if the user cannot be find on the database
				return Promise.reject(err);
			} else {
				// Pass the user orders array to the dataObj to be used by other queries
				for (let ctr = 0; ctr < orderResult.orders.length; ctr++) {
					// Checks if the orderId of the order is already in the uniqueElements array.
					// if yes the loop will continue and skip it. Else it will push the order to the dataObj.cart
					if (uniqueElements.includes(orderResult.orders[ctr]._id.toString())) {
						continue;
					} else {
						// Checks if the products array is empty
						if (orderResult.orders[ctr].products.length == 0) {
							// If yes, it will be removed permanently on the orders array on the database
							let index = orderResult.orders.indexOf(orderResult.orders[ctr]);
							orderResult.orders.splice(index, 1);

							return orderResult.save().then(result => {
								//
							})
						} else {
							dataObj.cart.push(orderResult.orders[ctr]);
						}
					}
				};
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
			productObj.id = dataObj.cart[ctr]._id;
			// Push the created object to the resultObj
			resultObj.cart.push(productObj);

			// Update the total amount of order on the database
			await User.findById(data.userId).then((userResult, err) => {
				if (err) {
					return Promise.reject(err);
				} else {
					// Find the index of the filtered orders of dataObj.cart from the actual orders array on the database
					let index = userResult.orders.indexOf(dataObj.cart[ctr].toString());

					// Loop will start on that index of the orders array in database
					for (let ctr3 = index; ctr3 < userResult.orders.length; ctr3++) {
						// Checks if the orderId on the database and the filtered order on dataObj.cart matches
						if (userResult.orders[ctr3]._id.toString() === dataObj.cart[ctr]._id.toString()) {
							// Updates the total amount of the order
							userResult.orders[ctr3].totalAmount = totalAmount.reduce((x, y) => x + y);

							// Save the changes on the orders array
							return userResult.save().then((saveResult, err) => {
								if (err) {
									console.error(err);
								} else {
									// console.log(userResult.orders[ctr3]);
								}
							});
						};
					};
				};
			});
		};

		// Return the final result
		return resultObj;
	};
};
// End of viewCart controller


// Controller for getting all the paid orders of the user
module.exports.getMyOrders = async (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If user is non-admin, proceed with the operations
	} else {
		// This will store the orderId's from the Product model
		const orderId = [];

		// Collect all the orderId of every order from Product model
		await Product.find({"order.userId": data.userId}).then((result, err) => {
			if (err) {
				console.log(err);
			} else {
				for (let ctr = 0; ctr < result.length; ctr++) {
					for (let ctr1 = 0; ctr1 < result[ctr].order.length; ctr1++) {
						// Push all the orderId to the orderId array to be use by other queries
						orderId.push(result[ctr].order[ctr1].orderId);		
					};
				};
			};
		});

		// This will only filter unique orderIds
		let uniqueElements = orderId.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		// This will contain the filtered orders
		const dataResult = {
			orders: []
		};

		// Find the authenticated user using it's userId
		await User.findById(data.userId).then((result, err) => {
			if (err) {
				// Throws an error if the user cannot be find on the database
				return Promise.reject(err);
			} else {
				for (let ctr = 0; ctr < result.orders.length; ctr++) {
					// Checks if the orderId of the order is already in the uniqueElements array.
					// if yes it will push the order to the dataResult.orders. Else the loop will continue and skip it.
					if (uniqueElements.includes(result.orders[ctr]._id.toString())) {
						dataResult.orders.push(result.orders[ctr]);
					} else {
						continue;
					}
				}	
			}
		});

		// This object will store the final result
		const resultObj = {
			message: "My orders",
			orders: []
		};

		// Loops through the dataResult.orders array to get the details needed
		for (let ctr = 0; ctr < dataResult.orders.length; ctr++) {
			// Loop scoped object to store the details needed
			const productObj = {
				products: []
			};
			// Array to store the total amount
			let totalAmount = [];

			// Loops through the products array of the dataResult.orders array
			for (let ctr1 = 0; ctr1 < dataResult.orders[ctr].products.length; ctr1++) {
				// Find the products using the retrieved productId's from the products array
				await Product.findById(dataResult.orders[ctr].products[ctr1].productId).then((productResult, err) => {
					if (err) {
						console.error(err);
					} else  {
						// Computes the subtotal of each product
						let subtotals = dataResult.orders[ctr].products[ctr1].quantity * productResult.price;
						// Push all the subtotal to the totalAmount array
						totalAmount.push(subtotals);

						// Push a new object to the productObj.products array
						productObj.products.push(
							{
								productId: dataResult.orders[ctr].products[ctr1].productId, 
								name: productResult.name,
								quantity: dataResult.orders[ctr].products[ctr1].quantity,
								price: productResult.price,
								subtotal: subtotals,
								_id: dataResult.orders[ctr].products[ctr1]._id
							}
						);
					};
				});
			};

			// Set other details for the productObj
			productObj.totalAmount = totalAmount.reduce((x, y) => x + y);
			productObj.purchasedOn = new Date(dataResult.orders[ctr].purchasedOn).toLocaleString();
			productObj.id = dataResult.orders[ctr]._id;
			// Push the created object to the resultObj
			resultObj.orders.push(productObj);

			// Updates the computed totalAmount of the order on the database
			await User.findById(data.userId).then((userResult, err) => {
				if (err) {
					return Promise.reject(err);
				} else {
					// Convert the two objectId's to string since comparing objectId's will always result to false
					let orderId = userResult.orders[ctr]._id.toString();
					let orderId_2 = dataResult.orders[ctr]._id.toString();

					if (orderId == orderId_2) {
						userResult.orders[ctr].totalAmount = totalAmount.reduce((x, y) => x + y);
						userResult.save().then((saveResult, err) => {
							if (err) {
								console.error(err);
							} else {
								// console.log(saveResult);
							}
						});
					};
				};
			});
		};

		// Return the final result
		return resultObj;
	};
};
// End of getMyOrders controller


// Controller to remove an order from the cart
module.exports.removeOrderFromCart = async (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If user is non-admin, proceed with the operations
	} else {
		// This will store the orderId's from the Product model
		const orderId = [];

		// Collect all the orderId of every order from Product model
		await Product.find({"order.userId": data.userId}).then((result, err) => {
			if (err) {
				console.log(err);
			} else {
				for (let ctr = 0; ctr < result.length; ctr++) {
					for (let ctr1 = 0; ctr1 < result[ctr].order.length; ctr1++) {
						// Push all the orderId to the orderId array to be use by other queries
						orderId.push(result[ctr].order[ctr1].orderId);		
					}
				}
			}
		});

		// This will only filter unique orderIds
		let uniqueElements = orderId.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		// Find the authenticated user using it's ID from the JSON web token
		return User.findById(data.userId).then((result, err) => {
			if (err) {
				// Throws an error if the user cannot be find on the database
				return Promise.reject(err);
			} else {
				/*If the user is found, this will loop through the order array of the user 
				to get the exact order matching the orderId provided from the request body*/
				for (let ctr = 0; ctr < result.orders.length; ctr++) {
					// Checks whether the order was already been checkout, if yes, API will not allow it
					if (uniqueElements.includes(data.order.orderId)) {
						return Promise.reject("Operation failed: this was already checked out.");
					} else {
						// If not, proceed with the operations
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
										message: "Products successfully removed from cart",
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
			};
		});
	};
};
// End of removeOrderfromCart controller


// Controller for removing a product from cart
module.exports.removeProductFromCart = async (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If user is non-admin, proceed with the operations
	} else {
		// This will store the orderId's from the Product model
		const orderId = [];

		// Collect all the orderId of every order from Product model
		await Product.find({"order.userId": data.userId}).then((result, err) => {
			if (err) {
				console.log(err);
			} else {
				for (let ctr = 0; ctr < result.length; ctr++) {
					for (let ctr1 = 0; ctr1 < result[ctr].order.length; ctr1++) {
						// Push all the orderId to the orderId array to be use by other queries
						orderId.push(result[ctr].order[ctr1].orderId);		
					};
				};
			};
		});

		// This will only filter unique orderIds
		let uniqueElements = orderId.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		// This object will contain the final result
		const dataResult = {
			message: "Product successfully removed from cart"
		};

		// Find the authenticated user using it's userId
		await User.findById(data.userId).then((result, err) => {
			if (err) {
				// Throws an error if the user cannot be find on the database
				return Promise.reject(err);
			} else {
				/*If the user is found, this will loop through the order array of the user to get the exact product
				inside the products array matching the productOrderId provided from the request body*/
				for (let ctr = 0; ctr < result.orders.length; ctr++) {
					for (let ctr1 = 0; ctr1 < result.orders[ctr].products.length; ctr1++) {
						if(data.order.productOrderId == result.orders[ctr].products[ctr1]._id) {
							// Checks if the orderId of the order where the product belongs was already checkout.
							if (uniqueElements.includes(result.orders[ctr]._id.toString())) {
								return Promise.reject("Operation failed: this product was already checked out.");
							} else {
								// Get the index of the found product on the array and remove it from the array using splice
								let index = result.orders[ctr].products.indexOf(result.orders[ctr].products[ctr1]);
								let spliceResult = result.orders[ctr].products.splice(index, 1);

								// Save changes on the products array of orders array
								return result.save().then((saveResult, err) => {
									if (err) {
										// Throws and error if the changes cannot be saved
										return Promise.reject("Failed to remove item");
									} else {
										// Add the removed product to the dataResult object
										dataResult.result = spliceResult;
									};
								});
							};
						} else {
							// Continue on the loop if the productOrderId from the request body and products array did not match
							continue;
						};
					}
				};
			};
		});

		// Return the dataResult object
		return Promise.resolve(dataResult);
	};
};
// End of removeProductFromCart controller


// Controller to update the quantity of the product
module.exports.updateOrderQuantity = async (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If user is non-admin, proceed with the operations
	} else {
		// This will store the orderId's from the Product model
		const orderId = [];

		// Collect all the orderId of every order from Product model
		await Product.find({"order.userId": data.userId}).then((result, err) => {
			if (err) {
				console.log(err);
			} else {
				for (let ctr = 0; ctr < result.length; ctr++) {
					for (let ctr1 = 0; ctr1 < result[ctr].order.length; ctr1++) {
						// Push all the orderId to the orderId array to be use by other queries
						orderId.push(result[ctr].order[ctr1].orderId);		
					};
				};
			};
		});

		// This will only filter unique orderIds
		let uniqueElements = orderId.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		// This will contain the final result
		const dataResult = {
			message: "Quantity successfully updated"
		};

		// Find the authenticated user using it's userId
		await User.findById(data.userId).then((result, err) => {
			if (err) {
				// Throws an error if the user cannot be found on the database
				return Promise.reject(err);
			} else {
				/*If the user is found, this will loop through the products array of the orders array
				to get the exact product matching the productOrderId provided from the request body*/
				for (let counter = 0; counter < result.orders.length; counter++) {
					for (let ctr = 0; ctr < result.orders[counter].products.length; ctr++) {
						if (data.order.orderId == result.orders[counter].products[ctr]._id) {

							// Checks if the orderId of the order where the product belongs was already checkout.
							if (uniqueElements.includes(result.orders[counter]._id.toString())) {
								return Promise.reject("Operation failed: this product was already checked out.");
							} else {
								// Updates the quantity of the product based on the quantity provided from the request body
								result.orders[counter].products[ctr].quantity = data.order.quantity;

								// Save the changes on the products array of the orders array
								return result.save().then((saveResult, err) => {
									if (err) {
										// Throws and error if the changes cannot be saved
										return Promise.reject("Failed to update quantity");
									} else {
										// Add the updated product to the dataResult object
										dataResult.result = result.orders[counter].products[ctr]
									};
								});
							};
						} else {
							// Continue on the loop if the productOrderId from the request body and products array did not match
							continue;
						};	
					};
				}; 
			};
		});

		// Return the dataResult object
		return Promise.resolve(dataResult);
	};
};
// End of updateOrderQuantity controller


// Controller for checking out an order
module.exports.checkOutOrder = async (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);

	// If user is non-admin, proceed with the operations
	} else {
		// This will store the orderId's from the Product model
		const orderIds = [];

		// Collect all the orderId of every order from Product model
		await Product.find({"order.userId": data.userId}).then((result, err) => {
			if (err) {
				console.log(err);
			} else {
				for (let ctr = 0; ctr < result.length; ctr++) {
					for (let ctr1 = 0; ctr1 < result[ctr].order.length; ctr1++) {
						// Push all the orderId to the orderId array to be use by other queries
						orderIds.push(result[ctr].order[ctr1].orderId);		
					}
				}
			}
		});

		// This will only filter unique orderIds
		let uniqueElements = orderIds.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		// Declare needed variables for later use
		let orderId;
		let purchasedOn;
		let totalAmount;
		let orderDetails = [];

		// Find the authenticated user using it's userId
		await User.findById(data.userId).then((result, err) => {
			if (err) {
				// Throws an error if the user cannot be found on the database
				return Promise.reject(err);
			} else {
				// This will loop through the orders array of the user
				for (let ctr = 0; ctr < result.orders.length; ctr++) {
					// Checks whether the order was already been checkout, if yes, API will not allow it
					if (uniqueElements.includes(data.order.orderId)) {
						return Promise.reject("Operation failed: This order was already checked out.");
					} else {
						// Checks if the orderId from the request body and orderId from the users orders array matched
						if(data.order.orderId == result.orders[ctr]._id) {
							for (let counter = 0; counter < result.orders[ctr].products.length; counter++) {
								// Assign the retrieved orderId to the orderId variable to be use by other queries
								orderId = result.orders[ctr]._id;

								// Assign the retrieved totalAmount to the totalAmount variable to be use by other queries
								totalAmount = result.orders[ctr].totalAmount;

								// This variable will store the current date
								const currentDate = new Date();

								// Assign the current date to the purchasedOn variable to be use by other queries
								purchasedOn = currentDate.toISOString();

								// Push the order details to the orderDetails array to be use by other queries
								orderDetails.push(result.orders[ctr].products[counter]);

								// Updates the purchasedOn date of the matched order on the database
								result.orders[ctr].purchasedOn = currentDate.toISOString();
							};
							// Save the changes on the orders array
							return result.save().then((save, err) => {
								if (err) {
									console.error(err);
								} else {
									//
								}
							});
						} else {
							// Continue on the loop if the orderId from the request body and orders array did not match
							continue;
						};
					};
				};
			};
		});

		// This object will contain the final result
		const dataResult = {
			message: "Items successfully checkout",
			order: [],
			totalAmount: totalAmount,
			checkOutDate: purchasedOn
		};

		// Declare variables for later use
		const quantity = [];
		const price = [];
		const name = [];

		// Loops through the orderDetails array
		for (order of orderDetails) {
			// Finds the product on the Product model using the productId's from the orderDetails array
			await Product.findById(order.productId).then((productResult, err) => {
				if (err) {
					console.log(err);
				} else {
					/* Assign the quantity, price and name of the identified product to
					its designated variables to be use by other code block*/
					quantity.push(order.quantity);
					price.push(productResult.price);
					name.push(productResult.name);

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
							// dataResult.order = orderDetails;		
						}
					});
				};
			});
		};

		// Get the details of the products that was checked out and return it as the response
		for (
				let ctr = 0, ctr1 = 0, ctr2 = 0, ctr4 = 0;
				ctr < orderDetails.length, ctr1 < quantity.length, ctr2 < price.length, ctr4 < name.length;
				ctr++, ctr1++, ctr2++, ctr4++
			) {
			dataResult.order.push({
				productId: orderDetails[ctr].productId,
				name: name[ctr4],
				quantity: orderDetails[ctr].quantity,
				price: price[ctr2],
				subtotal: (quantity[ctr1] * price[ctr2]),
				_id: orderDetails[ctr]._id
			});
		};

		// Returns the dataResult object
		return dataResult;
	};
};
// End of checkOutOrder controller


// Controller to get all users
module.exports.getAllUsers = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Get all the users and filter the necessary fields
		return User.find({}, {orders: 0, password: 0}).then((result, err) => {
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
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);
	}
};
// End of getAllUsers controller


// Controller for setting a user as admin
module.exports.setUserAsAdmin = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Finds the user using it's userId and filter the necessary fields
		return User.findById({_id: data.user.userId}, {password: 0, orders: 0}).then((result, err) => {
			if (result == null) {
				// Throws an error if the user does not exists
				const errorMessage = {
					message: "User does not exists!"
				}
				return Promise.reject(errorMessage);
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
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);
	};
};
// End of setUserAsAdmin controller


// Controller for setting an admin back to a normal user
module.exports.setAsNormalUser = (data) => {
	// Checks if the user is an admin
	if (data.isAdmin) {
		// Finds the user using it's userId and filter the necessary fields
		return User.findById({_id: data.user.userId}, {password: 0, orders: 0}).then((result, err) => {
			if (result == null) {
				// Throws an error if the user does not exists
				const errorMessage = {
					message: "User does not exists!"
				}
				return Promise.reject(errorMessage);
			} else {
				// If the user is found, set the isAdmin to true
				result.isAdmin = false;

				// Save the changes
				return result.save().then((saveResult, err) => {
					if (err) {
						return Promise.reject("Cannot save changes");
					} else {
						// Returns the message and the updated user
						const data = {
							message: "Successfully set as normal user",
							result: saveResult
						};
						return data;
					};
				});
			};
		});
	} else {
		// Throws an error if the user is not an admin
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);
	}
}
// End of setAsNormalUser controller


// Controller for getting all the orders, needs admin token
module.exports.getAllOrders = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Query through all the products and return the necessary fields only
		return Product.find({}, {name: 1, price: 1, order: 1}).then((result, err) => {
			if (err) {
				console.error(err);
			} else {
				// This object will be the final result
				const data = {
					message: "All orders",
					order: []
				};
				// Loops through the order array and check if the product has no order yet, If yes it will not be return.
				for (let ctr = 0; ctr < result.length; ctr++) {	
					if (result[ctr].order.length == 0) {
						continue;
					} else {
						// Push all the product details with order to the data.order array
						data.order.push(result[ctr]);
					}
				};
				// return the data object
				return data;
			}
		});
	} else {
		// Throws an error if the user is not an admin
		return Promise.reject("Error 403: Forbidden - You don't have permission to access this resource.");
	}
};
// End of getAllOrders controller


// Controller for getting all the orders - improved version
module.exports.fetchAllOrders = async (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// This will store the orderId's from the Product model
		const orderId = [];

		// Collect all the orderId of every order from Product model
		await Product.find({}).then((result, err) => {
			if (err) {
				console.log(err);
			} else {
				for (let ctr = 0; ctr < result.length; ctr++) {
					for (let ctr1 = 0; ctr1 < result[ctr].order.length; ctr1++) {
						// Push all the orderId to the orderId array to be use by other queries
						orderId.push(result[ctr].order[ctr1].orderId);
					};
				};
			};
		});

		// This will only filter unique orderIds
		let uniqueElements = orderId.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		// This will contain the filtered orders
		const dataResult = {
			orders: [],
			name: []
		};

		// Find all users
		await User.find({}).then((result, err) => {
			if (err) {
				// Throws an error if the user cannot be find on the database
				console.error(err);
			} else {
				// This object will store the orders details of all users
				let orderData = {
					orders: [],
					name: []
				};

				// Use 'for of loop' and store the result on the users variable since I cannot access the documents properties using 'result.propertyName'
				for (let users of result) {
					// Push the orders to the orderData.orders array
					orderData.orders.push(users.orders);

					// Push the name of the owner of the orders to the orderData.name array
					orderData.name.push(`${users.firstName} ${users.lastName}`);
				};

				// Loops through the orderData.orders array
				for (let ctr = 0; ctr < orderData.orders.length; ctr++) {
					// Checks if the orderId of the order is already in the uniqueElements array.
					// if yes it will push the order to the dataResult.orders. Else the loop will continue and skip it.
					for (let ctr1 = 0; ctr1 < orderData.orders[ctr].length; ctr1++) {
						if (uniqueElements.includes(orderData.orders[ctr][ctr1]._id.toString())) {
							dataResult.orders.push(orderData.orders[ctr][ctr1]);
							dataResult.name.push(orderData.name[ctr]);
						} else {
							continue;
						};
					};
				};
			};
		});

		// This object will store the final result
		const resultObj = {
			message: "All orders",
			orders: []
		};

		// Loops through the dataResult.orders array to get the details needed
		for (let ctr = 0; ctr < dataResult.orders.length; ctr++) {
			// Loop scoped object to store the details needed
			const productObj = {
				name: dataResult.name[ctr],
				products: []
			};
			// Array to store the total amount
			let totalAmount = [];

			// Loops through the products array of the dataResult.orders array
			for (let ctr1 = 0; ctr1 < dataResult.orders[ctr].products.length; ctr1++) {
				// Find the products using the retrieved productId's from the products array
				await Product.findById(dataResult.orders[ctr].products[ctr1].productId).then((productResult, err) => {
					if (err) {
						console.error(err);
					} else  {
						// Computes the subtotal of each product
						let subtotals = dataResult.orders[ctr].products[ctr1].quantity * productResult.price;
						// Push all the subtotal to the totalAmount array
						totalAmount.push(subtotals);

						// Push a new object to the productObj.products array
						productObj.products.push(
							{
								productId: dataResult.orders[ctr].products[ctr1].productId,
								name: productResult.name,
								quantity: dataResult.orders[ctr].products[ctr1].quantity,
								price: productResult.price,
								subtotal: subtotals,
								_id: dataResult.orders[ctr].products[ctr1]._id
							}
						);
					};
				});
			};

			// Set other details for the productObj
			productObj.totalAmount = totalAmount.reduce((x, y) => x + y);
			productObj.purchasedOn = new Date(dataResult.orders[ctr].purchasedOn).toLocaleString(); // <---- change here
			productObj.id = dataResult.orders[ctr]._id;
			// Push the created object to the resultObj
			resultObj.orders.push(productObj);
		};

		// Return the final result
		return resultObj;

	} else {
		// Throws an error if the user is not an admin
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		return Promise.reject(errorMessage);
	}
};
// End of fetchAllOrders controller