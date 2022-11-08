// Import dependencies 
const express = require("express");
const router = express.Router();
const auth = require("../auth");

// Import the controller
const userController = require("../controllers/userControllers");

// Routes

// Route for registering a user
router.post("/register", (req, res) => {
	userController.registerUser(req.body)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for user login 
router.post("/login", (req, res) => {
	userController.loginUser(req.body)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to get the profile/details of the authenticated user
router.get("/profile", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.getProfile({userId: userData.id})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to add product/s to the cart of the authenticated user
router.post("/add-to-cart", (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id
	};

	userController.addToCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to view the cart of the authenticated user
router.get("/cart", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.viewCart({userId: userData.id})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to get all the orders that has been checkout already
router.get("/cart/paid", (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.getMyOrders({userId: userData.id})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to remove a group of products from the cart of the authenticated user
router.put("/cart/remove/:orderId", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.params,
		userId: userData.id
	};

	userController.removeOrderFromCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to remove a single product from the cart of the authenticated user
router.put("/cart/remove-product/:productOrderId", (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.params,
		userId: userData.id
	};

	userController.removeProductFromCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to update the quantity of a product from the cart of the authenticated user
router.patch("/cart/update-quantity", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id
	};

	userController.updateOrderQuantity(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to checkout an order from the cart of the authenticated user
router.post("/cart/checkout", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id
	};

	userController.checkOutOrder(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to get all users registered to the API, needs admin token
router.get("/all-users", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.getAllUsers({isAdmin: userData.isAdmin})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to set a user to be an admin, needs admin token
router.put("/updateAdmin/:userId", auth.verify, (req, res) => {
	const data = {
		user: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	userController.setUserAsAdmin(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Export the router
module.exports = router;