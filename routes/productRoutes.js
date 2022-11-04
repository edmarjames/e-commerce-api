// Import dependencies 
const express = require("express");
const router = express.Router();
const auth = require("../auth");

// Import the controller
const productController = require("../controllers/productControllers");

// Routes
router.get("/", (req, res) => {
	productController.getAllProducts()
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});


router.get("/active", (req, res) => {
	productController.getActiveProducts()
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.get("/:productId", (req, res) => {
	productController.getSingleProduct(req.params)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
})

router.post("/add", auth.verify, (req, res) => {
	const data = {
		product: req.body,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	productController.addProduct(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.put("/update/:productId", auth.verify, (req, res) => {
	const data = {
		product: req.body,
		params: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	productController.updateProduct(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

router.put("/archive/:productId", auth.verify, (req, res) => {
	const data = {
		product: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};

	productController.archiveProduct(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
})

router.put("/activate/:productId", auth.verify, (req, res) => {
	const data = {
		product: req.params,
		isAdmin: auth.decode(req.headers.authorization).isAdmin
	};
	
	productController.activateProduct(data)
	.then(controllerResult => res.send(controllerResult))
	.catch(controllerError => res.send(controllerError));
});

module.exports = router;