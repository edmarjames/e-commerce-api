// Import dependencies 
const express = require("express");
const router = express.Router();
const auth = require("../auth");

// Import the controller
const productController = require("../controllers/productControllers");

// Routes

// Route for getting all products
router.get("/", (req, res) => {
	productController.getAllProducts()
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for getting all active products
router.get("/active", (req, res) => {
	productController.getActiveProducts()
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for getting all orders categorized per product, needs admin token
router.get("/all-orders", auth.verify, (req, res) => {

	const userData = auth.decode(req.headers.authorization);

	productController.getAllOrders({isAdmin: userData.isAdmin})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for getting a specific product
router.get("/:productId", (req, res) => {
	productController.getSingleProduct(req.params)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for adding a product, needs admin token
router.post("/add", auth.verify, (req, res) => {
	const data = {
		product: req.body,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	productController.addProduct(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for updating a product details, needs admin token
router.put("/:productId", auth.verify, (req, res) => {
	const data = {
		product: req.body,
		params: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	productController.updateProduct(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for archiving a product, needs admin token
router.put("/:productId/archive", auth.verify, (req, res) => {
	const data = {
		product: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	productController.archiveProduct(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
})

// Route for activating a product
router.put("/:productId/activate", auth.verify, (req, res) => {
	const data = {
		product: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};
	
	productController.activateProduct(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Export the router
module.exports = router;