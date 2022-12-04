// Import dependencies
const jwt = require("jsonwebtoken");
const secret = "eCommerceAPI";

// Create JSON Web Token
module.exports.createAccessToken = (user) => {
	const data = {
		id: user._id,
		email: user.email,
		isAdmin: user.isAdmin
	};
	return jwt.sign(data, secret, {});
};

// Token Verification
module.exports.verify = (req, res, next) => {
	let token = req.headers.authorization;

	if (typeof token !== "undefined") {
		console.log(token);
		token = token.slice(7, token.length);

		return jwt.verify(token, secret, (err, data) => {
			if (err) {
				return res.send({auth: "Error 401 - Unauthorized"});
			} else {
				next();
			}
		});
	} else {
		return res.send({auth: "Error 401 - Unauthorized"});
	}
};

// Token decryption
module.exports.decode = (token) => {
	if (typeof token !== "undefined") {
		token = token.slice(7, token.length);
		return jwt.verify(token, secret, (err, data) => {
			if (err) {
				return null;
			} else {
				return jwt.decode(token, {complete: true}).payload;
			}
		});
	} else {
		return null;
	};
};