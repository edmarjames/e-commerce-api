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
router.get("/getUserDetails", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.getProfile({userId: userData.id})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.post("/changePassword", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		reqBody: req.body,
		userId: userData.id,
		isAdmin: userData.isAdmin
	}

	userController.changePassword(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
})

// Route for creating an order and checks out automatically
router.post("/checkout", (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id,
		isAdmin: userData.isAdmin
	};

	userController.createOrder(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to add product/s to the cart of the authenticated user
router.post("/addToCart", (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id,
		isAdmin: userData.isAdmin
	};

	userController.addToCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to view the cart of the authenticated user
router.get("/cart", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		userId: userData.id,
		isAdmin: userData.isAdmin
	}

	userController.viewCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to get all the orders that has been checkout already
router.get("/myOrders", (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		userId: userData.id,
		isAdmin: userData.isAdmin
	}

	userController.getMyOrders(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to remove a group of products from the cart of the authenticated user
router.put("/cart/remove/:orderId", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.params,
		userId: userData.id,
		isAdmin: userData.isAdmin
	};

	userController.removeOrderFromCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to remove a single product from the cart of the authenticated user
router.put("/cart/removeProduct/:productOrderId", (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.params,
		userId: userData.id,
		isAdmin: userData.isAdmin
	};

	userController.removeProductFromCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to update the quantity of a product from the cart of the authenticated user
router.patch("/cart/updateQuantity", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id,
		isAdmin: userData.isAdmin
	};

	userController.updateOrderQuantity(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to checkout an order from the cart of the authenticated user
router.post("/checkoutFromCart", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id,
		isAdmin: userData.isAdmin
	};

	userController.checkOutOrder(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for getting all orders categorized per product, needs admin token
router.get("/orders", auth.verify, (req, res) => {

	const userData = auth.decode(req.headers.authorization);

	userController.getAllOrders({isAdmin: userData.isAdmin})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to get all users registered to the API, needs admin token
router.get("/allUsers", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.getAllUsers({isAdmin: userData.isAdmin})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route for getting all orders categorized per product, needs admin token
router.get("/allOrders", auth.verify, (req, res) => {

	const userData = auth.decode(req.headers.authorization);

	userController.fetchAllOrders({isAdmin: userData.isAdmin})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

// Route to set a user to be an admin, needs admin token
router.put("/:userId/setAsAdmin", auth.verify, (req, res) => {
	const data = {
		user: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	userController.setUserAsAdmin(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.put("/:userId/setAsNormalUser", auth.verify, (req, res) => {
	const data = {
		user: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	userController.setAsNormalUser(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
})

// Export the router
module.exports = router;