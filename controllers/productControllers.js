// Import the model
const Product = require("../models/Product");

// Import dependencies
const auth = require("../auth");

// Controller for getting all products
module.exports.getAllProducts = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Get all the products and return the necessary fields only
		return Product.find({}, {order: 0}).then((result, err) => {
			if (err) {
				return Promise.reject(err);
			} else {
				// Returns a message and all the products
				const data = {
					message: "All products",
					products: result
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
// End of getAllProducts controller


// Controller for getting all active products
module.exports.getActiveProducts = () => {
	// Get all the active products and return the necessary fields only
	return Product.find({isActive: true}, {order: 0}).then((result, err) => {
		if (err) {
			return Promise.reject(err);
		} else {
			// Returns a message and all the active products
			const data = {
				message: "Active products",
				products: result
			}
			return data;
		}
	});
};
// End of getActiveProducts controller


// Controller for getting a specific product
module.exports.getSingleProduct = (reqParams) => {
	// Finds the product using it's productId provided from the request parameters and return the necessary fields only
	return Product.findById({_id: reqParams.productId}, {order: 0}).then((result, err) => {
		if (result == null) {
			const noResult = {
				message: "Product does not exists"
			};
			return Promise.reject(noResult);
		} else {
			// Returns a message and the retrieved product
			const data = {
				message: "Product details",
				product: result
			}
			return data;
		}
	});
}
// End of getSingleProduct controller


// Controller for adding a product, needs admin token
module.exports.addProduct = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Loops through the request body to get the product name
		for (let product of data.product) {
			return Product.find({name: product.name}).then(result => {
				if (result.length > 0) {
					const errorMessage = {
						message: "Operation failed: product already exists"
					}
					// Throws an error if the product already exists
					return Promise.reject(errorMessage);
				} else {
					// Add all the products from the request body, used insertMany to insert multiple products
					return Product.insertMany(data.product).then((addResult, err) => {
						if (err) {
							return Promise.reject("Something went wrong");
						} else {
							// Returns a message and the added product/s
							const data = {
								message: "Product added successfully!",
								result: addResult
							}
							return data;
						};
					});
				};
			});
		};
	} else {
		const errorMessage = {
			message: "Error 403: Forbidden - You don't have permission to access this resource."
		}
		// Throws an error if the user is not an admin
		return Promise.reject(errorMessage);
	}
};
// End of addProduct controller


// Controller for updating product details, needs admin token
module.exports.updateProduct = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Find the product using it's productId and return the necessary fields only
		return Product.findById({_id: data.params.productId}, {order: 0}).then((result, err) => {
			if (result == null) {
				const errorMessage = {
					message: "Operation failed: product does not exists"
				}
				// Throws an error if the product does not exists
				return Promise.reject(errorMessage);
			} else {
				/*Checks if there is a field not provided from the request body, if there is, the value of the field will be the same as before.
				If not the value will be updated based from the request body*/
				(data.product.name == null) ? result.name = result.name : result.name = data.product.name;
				(data.product.description == null) ? result.description = result.description : result.description = data.product.description;
				(data.product.price == null) ? result.price = result.price : result.price = data.product.price;

				// Save the changes
				return result.save().then((saveResult, err) => {
					if (err) {
						return Promise.reject("Failed to update product details!");
					} else {
						// Returns a message and the updated product
						const data = {
							message: "Product updated successfully!",
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
// End of updateProduct controller


// Controller for archiving a product, needs admin token
module.exports.archiveProduct = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Find the product using it's productId and return the necessary fields only
		return Product.findById({_id: data.product.productId}, {order: 0}).then((result, err) => {
			if (result == null) {
				// Throws an error if the product does not exists
				const errorMessage = {
					message: "Operation failed: product does not exists"
				}
				return Promise.reject(errorMessage);
			} else {
				// If the product is found, set the isActive to false
				result.isActive = false;

				// Save the changes
				return result.save().then((archiveResult, err) => {
					if (err) {
						console.error(err);
					} else {
						// Returns a message and the archived product
						const data = {
							message: "Product archived successfully!",
							result: archiveResult
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
// End of archiveProduct controller


// Controller for activating a product, needs admin token
module.exports.activateProduct = (data) => {
	// Checks if the authenticated user is an admin
	if (data.isAdmin) {
		// Find the product using it's productId and return the necessary fields only
		return Product.findById({_id: data.product.productId}, {order: 0}).then((result, err) => {
			if (result == null) {
				// Throws an error if the product does not exists
				const errorMessage = {
					message: "Operation failed: product does not exists"
				}
				return Promise.reject(errorMessage);
			} else {
				// If the product is found, set the isActive to true
				result.isActive = true;

				// Save the changes
				return result.save().then((activateResult, err) => {
					if (err) {
						console.error(err);
					} else {
						// Returns a message and the activated product
						const data = {
							message: "Product activated successfully!",
							result: activateResult
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
};
// End of activateProduct controller