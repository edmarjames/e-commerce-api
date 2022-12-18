# Table of contents
+ [Introduction](#e-commerce-rest-api)
+ [Routes](#routes)
+ [Upcoming new features](#upcoming-new-features)
+ [Installation](#installation)
+ [Roadmap](#roadmap)
+ [Project status](#project-status)
+ [Languages and tools](#language-and-tools)

## <a name="#e-commerce-rest-api"></a>E-commerce REST API

This project serves as the backend for my full stack e-commerce site during my coding bootcamp. This was also my Capstone-2 project on the said bootcamp. It follows the REST architecture for building API's and was built using MongoDB, Express.js and Node.js.

## Routes

1. [Register](https://capstone-2-bautista.onrender.com/users/register) 
    - This **POST** route allows the user to register to the e-commerce api. The request body is in JSON format and requires the following.

        ```
        {
		    "firstName": "Jane",
		    "lastName": "Doe",
		    "email": "jane@mail.com",
		    "password": "jane1",
		    "mobileNo": "09123456789"
		}    
        ```

    - **Validation**
        - The API will not allow user's to register using an email that is already taken or already existing in the database.

2. [Login](https://capstone-2-bautista.onrender.com/users/login)
    - This **POST** route allows the user to login to the e-commerce api. Upon successful login, the API will provide the generated JSON web token on the response. The request body is in JSON format and requires the following.

    	```
    	{
		    "email": "jane@mail.com",
		    "password": "jane1"
		}
    	```

    - **Validation**
    	- The API can determine if the email or password is incorrect and will throw an error message as a response.

3. [Get all active products](https://capstone-2-bautista.onrender.com/products/active)
    - This **GET** route allows non-authenticated and authenticated users to fetch all the details of active products. The response is in a JavaScript object format.

4. [Get single product](https://capstone-2-bautista.onrender.com/products/6392c8e322375445dc545ad4)
    - This **GET** route allows non-authenticated and authenticated users to fetch the details of a certain product. The URL requires a productId parameter. Please see route below.

        **`https://capstone-2-bautista.onrender.com/products/:productId`**

5. [View profile](https://capstone-2-bautista.onrender.com/users/getUserDetails)
    - This **GET** route allows authenticated users to view their basic details such as firstname, lastname, email and mobile number. It requires a bearer token of the authenticated user, you may enter the generated JSON web token provided on the login route. The response is in a JavaScript object format.

6. [Change password](https://capstone-2-bautista.onrender.com/users/changePassword)
    - This **POST** route allows authenticated users to update their password. It requires a bearer token of the authenticated user and the request body is in JSON format and requires the following.

        ```
        {
		    "oldPassword": "jane1",
		    "newPassword": "jane123"
		}
        ```

    - **Validations**
        - The user must enter his/her old password correctly since the API will provide an error message if it is incorrect.
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

7. [Create order](https://capstone-2-bautista.onrender.com/users/checkout)
    - This **POST** route allows authenticated users to create single or multiple orders. Upon creating an order, the order will show on the order history. This requires a bearer token of the user and the request body is in JSON format and requires the following.
        - productId
        - quantity

    - If the user wants to create multiple orders at the same time. He/she may wrap the request body with square brackets. Please refer to the snippet below.

        ```
	    [
		    {
		        "productId": "63904850d5002a4a038466cb",
		        "quantity": 1
		    },
		    {
		        "productId": "639048afd5002a4a038466d0",
		        "quantity": 2
		    }
		]
        ```

    - **Validation**
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

8. [Add to cart](https://capstone-2-bautista.onrender.com/users/addToCart)
    - This **POST** route allows authenticated users to add single or multiple products to the cart. It requires a bearer token of the user and the request body is in JSON format and requires the following.
        - productId
        - quantity

    - If the user wants to create multiple orders at the same time. He/she may wrap the request body with square brackets. Please refer to the snippet below.


        ```
	    [
		    {
		        "productId": "63904850d5002a4a038466cd",
		        "quantity": 1
		    },
		    {
		        "productId": "639048afd5002a4a038466d1",
		        "quantity": 2
		    }
		]
        ```

    - **Validation**
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

9. [View cart](https://capstone-2-bautista.onrender.com/users/cart)
    - This **GET** route allows authenticated users to view their cart. It requires a bearer token of the user. The response is in a JavaScript object format.

    - **Validation**
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

10. [Remove products from cart](https://capstone-2-bautista.onrender.com/users/cart/remove/639ed63f0cf6a4468acb9ce0)
	- This **PUT** route allows authenticated users to remove a group of products from their cart. It requires a bearer token of the user and the URL requires an orderId parameter. Please see route below.

	    **`https://capstone-2-bautista.onrender.com/users/cart/remove/:orderId`**

	- As reference, this is the orderId on the user's cart.

	![orderId](/uploads/ddddb1e0a38c8ca78293361046ed0c77/orderId.png)

	- The API will provide a message as a response, once operation is successful.

	- **Validations**
		- The API will provide an error message as a response, once the orderId provided is an orderId of a group of products from cart that was already checked out.
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

11. [Remove single product](https://capstone-2-bautista.onrender.com/users/cart/removeProduct/639ed63f0cf6a4468acb9ce2)
    - This **PUT** route allows authenticated users to remove a single product from their cart. It requires a bearer token of the user and the URL requires a productOrderId parameter. Please see route below.

        **`https://capstone-2-bautista.onrender.com/users/cart/removeProduct/:productOrderId`**

    - As reference, this is the productOrderId on the user's cart.

    ![productOrderId](/uploads/d51fa1518f1146523f10870d22f49afb/productOrderId.png)

    - The API will provide a message as a response, once operation is successful.

    - **Validations**
		- The API will provide an error message as a response, once the productOrderId provided is a productOrderId of a product that was already checked out.
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

12. [Update product quantity](https://capstone-2-bautista.onrender.com/users/cart/updateQuantity)
    - This **PATCH** route allows authenticated users to update the quantity of a certain product on his/her cart. It requires a bearer token of the user and the request body is in JSON format and requires the following.

        ```
	    {
		    "orderId": "639ed63f0cf6a4468acb9ce2",
		    "quantity": 2
		}
        ```

    - The orderId here, refers to the productOrderId on the user's cart.

    - The API will provide a message as a response, once operation is successful.

    - **Validations**
		- The API will provide an error message on the response once the productOrderId provided is a productOrderId of a product that was already checked out.
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

13. [Checkout from cart](https://capstone-2-bautista.onrender.com/users/checkoutFromCart)
    - This **POST** route allows authenticated users to checkout products from their cart. It requires a bearer token of the user and the request body is in JSON format and requires the following.

        ```
	    {
	    	"orderId": "639ed63f0cf6a4468acb9ce0"
		}
        ```

    - The API will provide a message as a response, once operation is successful.

    - **Validations**
		- The API will provide an error message on the response once the orderId provided is an orderId of a product/s from cart that was already checked out.
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

14. [View order history](https://capstone-2-bautista.onrender.com/users/myOrders)
    - This **GET** route allows authenticated users to view their order history. It requires a bearer token of the user. The response is in a JavaScript object format.

    - **Validation**
        - This route is only permitted to non-admin users. The API will provide an error message if an admin tries to access this route.

15. [Get all products](https://capstone-2-bautista.onrender.com/products/)
	- This **GET** route allows **admin** users to fetch all product details regardless if it is active or not. This requires an admin access token and the response is in a JavaScript object format.

	- **Validation**
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

16. [Add product](https://capstone-2-bautista.onrender.com/products/add)
    - This **POST** route allows **admin** users to add a new product to the database. This requires an admin access token and the request body is in JSON format and requires the following.
        - name
        - description
        - source
        - price

    - The source here, refers to the image url.

    - If the admin wants to add multiple products at the same time. He/she wrap your request body with square brackets. Please refer to the snippet below.

        ```
	    [
		    {
		        "name": "Item A",
		        "description": "Item A description",
		        "source": "https://i.ibb.co/TPx5GDS/product-image-placeholder.jpg",
		        "price": "100"
		    },
		    {
		        "name": "Item B",
		        "description": "Item B description",
		        "source": "https://i.ibb.co/TPx5GDS/product-image-placeholder.jpg",
		        "price": "200"
		    }
		]
        ```

    - **Validations**
        - The API will show an error message as a response, if the provided product name is already existing in the database.
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

17. [Update product](https://capstone-2-bautista.onrender.com/products/639ed7800cf6a4468acba0d2)
    - This **PUT** route allows **admin** users to update the details of a specific product. This requires an admin access token and the URL requires a productId parameter. Please see route below. 

        **`https://capstone-2-bautista.onrender.com/products/:productId`**

        The request body is in JSON format and requires the following.

        ```
	    {
	    	"name": Item A,
	    	"description" "Item A description",
	    	"source": "https://i.ibb.co/TPx5GDS/product-image-placeholder.jpg",
	    	"price": 200
		}
        ```

    - The admin may also opted to put only the detail that is needed to be updated either it is the name, description, source or price.

    - **Validations**
        - The API will show an error message as a response, if the provided productId does not exists in the database.
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

18. [Archive product](https://capstone-2-bautista.onrender.com/products/639ed7800cf6a4468acba0d2/archive)
    - This **PUT** route allows **admin** users to archive a specific product. This requires an admin access token and the URL requires a productId parameter. Please see route below. 

        **`https://capstone-2-bautista.onrender.com/products/:productId/archive`**

    - The API will provide a message as a response, once operation is successful.

    - **Validations**
        - The API will show an error message as a response if the provided productId does not exists in the database.
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

19. [Activate product](https://capstone-2-bautista.onrender.com/products/639ed7800cf6a4468acba0d2/activate)
    - This **PUT** route allows **admin** users to activate a specific product. This requires an admin access token and the URL requires a productId parameter. Please see route below.

        **`https://capstone-2-bautista.onrender.com/products/:productId/activate`**

    - The API will provide a message as a response, once operation is successful.

    - **Validations**
        - The API will show an error message as a response if the provided productId does not exists in the database.
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

20. [Get all orders](https://capstone-2-bautista.onrender.com/users/allOrders)
    - This **GET** route allows **admin** users to fetch all the orders of all users registered on the API. This requires an admin access token. The response is in a JavaScript object format.

    - **Validation**
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

21. [Get all users](https://capstone-2-bautista.onrender.com/users/allUsers)
    - This **GET** route allows **admin** users to fetch the details of all users registered on the API.
    This requires an admin access token. The response is in a JavaScript object format.

    - **Validation**
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

22. [Set user as admin](https://capstone-2-bautista.onrender.com/users/639ed3720cf6a4468acb9b29/setAsAdmin)
    - This **PUT** route allows **admin** users to pick a user from the list of all users and set him/her as an admin. This requires an admin access token. The URL requires a userId parameter. Please see route below.

        **`https://capstone-2-bautista.onrender.com/users/:userId/setAsAdmin`**

    - The API will provide a message as a response, once operation is successful.

    - **Validations**
    	- The API will provide an error message as a response, if the provided userId does not exist in the database.
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

23. [Set as normal user](https://capstone-2-bautista.onrender.com/users/639ed3720cf6a4468acb9b29/setAsNormalUser)
    - This **PUT** route allows **admin** users to pick a user from the list of all users and revoke admin privilages from him/her. This requires an admin access token. The URL requires a userId parameter. Please see route below.

        **`https://capstone-2-bautista.onrender.com/users/:userId/setAsNormalUser`**

    - The API will provide a message as a response, once operation is successful.

    - **Validations**
    	- The API will provide an error message as a response, if the provided userId does not exist in the database.
        - This route is only permitted to admin users. The API will provide an error message if a non-admin user tries to access this route.

## <a name="#upcoming-new-features"></a>Upcoming New Features

Since my project does not have features yet that are present on popular E-commerce sites nowadays. I am continously developing new features that will transform my app into a real and publishable one.

Here is an overview of the upcoming features

+ Add shipping address on checkout
+ Payment options
+ Order status
+ Order tracking
+ Order cancellation
+ Product review

## Installation

If you want to checkout the code and install it on your local machine you may clone my repo by simply running this command.

### `git clone git@gitlab.com:batch-211-bautista/capstone-2-bautista.git`

Then install the packages by simply running.

### `npm install`

Then simply run this command to start it on your localhost.

### `nodemon index.js`

Please feel free to use your favorite API Testing tool but I recommend using Postman.

## Roadmap

For the future releases, I'm planning to follow the list of my upcoming new features listed above and I will also update this README file once I got new ideas along the way.

## <a name="#project-status"></a>Project Status

As of now, I'm taking a break on development since I am also going to be busy on Job hunting. But please feel free to check the code and let me know if you find any bugs or potential new features.

## <a name="#language-and-tools"></a>Languages and tools used

<p align="center">
    ![logo-mongodb-with-name](/uploads/f860dec26db0a69ef9a12488812057c8/logo-mongodb-with-name.png)
    ![logo-expressjs-with-name](/uploads/ee4325e407dec9709d189b97ce4cc69c/logo-expressjs-with-name.png)
    ![logo-nodejs-with-name](/uploads/0603502f0b4cded65579c5d773ae3fec/logo-nodejs-with-name.png)
    ![logo-git-with-name](/uploads/048bca6c9875b9bc7a4a35acabb6ec35/logo-git-with-name.png)
    ![logo-postman-with-name](/uploads/44a043b21779f3075455ec8867d3d92b/logo-postman-with-name.png)
    ![logo-sublime-text-3-with-name](/uploads/a41216bc7af655f6d540456e61b216c7/logo-sublime-text-3-with-name.png)
</p>


