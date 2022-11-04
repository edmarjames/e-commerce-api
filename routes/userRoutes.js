// Import dependencies 
const express = require("express");
const router = express.Router();
const auth = require("../auth");

// Import the controller
const userController = require("../controllers/userControllers");

// Routes
router.post("/register", (req, res) => {
	userController.registerUser(req.body)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.post("/login", (req, res) => {
	userController.loginUser(req.body)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.get("/profile", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.getProfile({userId: userData.id})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.post("/add-to-cart", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id
	}

	userController.addToCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.get("/cart", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.viewCart({userId: userData.id})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.get("/cart/paid", (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.getPaidOrders({userId: userData.id})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.put("/cart/remove/:orderId", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.params,
		userId: userData.id
	}

	userController.removeOrderFromCart(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.patch("/cart/update-quantity", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id
	}

	userController.updateOrderQuantity(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.patch("/cart/checkout", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);
	const data = {
		order: req.body,
		userId: userData.id
	};

	userController.checkOutOrder(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.get("/all-orders", auth.verify, (req, res) => {

	const userData = auth.decode(req.headers.authorization);

	userController.getAllOrders({isAdmin: userData.isAdmin})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.get("/all-users", auth.verify, (req, res) => {
	const userData = auth.decode(req.headers.authorization);

	userController.getAllUsers({isAdmin: userData.isAdmin})
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.put("/set-admin/:userId", auth.verify, (req, res) => {

	const data = {
		user: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	}
	// const userData = auth.decode(req.headers.authorization);

	userController.setUserAsAdmin(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

module.exports = router;