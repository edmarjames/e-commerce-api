// Import the model
const Product = require("../models/Product");

// Import dependencies
const auth = require("../auth");


module.exports.getAllProducts = () => {
return Product.find({}, {order: 0}).then((result, err) => {
		if (err) {
			return Promise.reject(err);
		} else {
			const data = {
				message: "All products",
				products: result
			};
			return data;
		}
	});
};

module.exports.getActiveProducts = () => {
	return Product.find({isActive: true}, {order: 0}).then((result, err) => {
		if (err) {
			return Promise.reject(err);
		} else {
			const data = {
				message: "Active products",
				products: result
			}
			return data;
		}
	});
};

module.exports.getSingleProduct = (reqParams) => {
	return Product.findById({_id: reqParams.productId}, {order: 0}).then((result, err) => {
		if (err) {
			return Promise.reject("Product does not exists");
		} else {
			const data = {
				message: "Product details",
				product: result
			}
			return data;
		}
	});
}

module.exports.addProduct = (data) => {
	/*if (data.isAdmin) {
		return Product.find({productName: data.product.productName}).then(result => {
			if (result.length > 0) {
				return Promise.reject("Product already exists!");
			} else {
				let newProduct = new Product({
					productName: data.product.productName,
					brand: data.product.brand, 
					price: data.product.price
				});
				return newProduct.save().then((addResult, err) => {
					if (err) {
						return Promise.reject("Something went wrong");
					} else {
						const data = {
							message: "Product added successfully!",
							result: addResult
						}
						return Promise.resolve(data);
					}
				});
			}
		});
	} else {
		return Promise.resolve("You are not allowed to access this feature!");
	};*/

	if (data.isAdmin) {
		for (let product of data.product) {
			return Product.find({name: product.name}).then(result => {
				if (result.length > 0) {
					return Promise.reject("Product already exists!");
				} else {
					return Product.insertMany(data.product).then((addResult, err) => {
						if (err) {
							return Promise.reject("Something went wrong");
						} else {
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
		return Promise.reject("You are not allowed to access this feature!");
	}
};

module.exports.updateProduct = (data) => {
	if (data.isAdmin) {
		return Product.findById(data.params.productId).then((result, err) => {
			if (err) {
				return Promise.reject("Product does not exists!");
			} else {
				(data.product.name == null) ? result.name = result.name : result.name = data.product.name;
				(data.product.description == null) ? result.description = result.description : result.description = data.product.description;
				(data.product.price == null) ? result.price = result.price : result.price = data.product.price;
				return result.save().then((saveResult, err) => {
					if (err) {
						return Promise.reject("Failed to update product details!");
					} else {
						const data = {
							message: "Product updated successfully!",
							result: saveResult
						};
						return Promise.resolve(data);
					};
				});
			};
		});
	} else {
		return Promise.reject("You are not allowed to access this feature!");
	};	
};

module.exports.archiveProduct = (data) => {
	if (data.isAdmin) {
		return Product.findById(data.product.productId).then((result, err) => {
			if (err) {
				return Promise.reject("This product does not exists!");
			} else {
				result.isActive = false;
				return result.save().then((archiveResult, err) => {
					if (err) {
						console.error(err);
					} else {
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
		return Promise.reject("You are not allowed to access this feature!");
	};
};

module.exports.activateProduct = (data) => {
	if (data.isAdmin) {
		return Product.findById(data.product.productId).then((result, err) => {
			if (err) {
				return Promise.reject("This product does not exists!");
			} else {
				result.isActive = true;
				return result.save().then((activateResult, err) => {
					if (err) {
						console.error(err);
					} else {
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
		return Promise.reject("You are not allowed to access this feature!");
	}
};

module.exports.getAllOrders = (data) => {

	if (data.isAdmin) {
		return Product.find({}, {name: 1, price: 1, order: 1}).then((result, err) => {
			if (err) {
				console.error(err);
			} else {
				const data = {
					message: "All orders",
					order: []
				};

				for (let ctr = 0; ctr < result.length; ctr++) {	
					if (result[ctr].order.length == 0) {
						continue;
					} else {
						data.order.push(result[ctr]);
					}
				};

				return data;
			}
		});
	} else {
		return Promise.reject("You are not allowed to access this feature!");
	}

};