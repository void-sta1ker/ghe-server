# Viva preparation

## Tech questions

### Q1. Why did you choose monolithic architecture over microservices?

- simplicity
- development speed
- testing & debugging
- resource efficiency

### Q2. How do you plan to maintain/scale the server and handle server overload?

- horizontal scaling
- nginx for load balancing and rate limiting
- caching with redis
- optimizing database queries/indexes to reduce response times

### Q3. How did you use AWS?

I utilized AWS S3 storage service. I created a bucket to store images, configured bucket policy and cors, enabled public access. I also granted my bucket owner account read/write access to objects stored in the bucket. I obtained the access key id, secret access key, region name and bucket name and feed them into my server so that it can use aws-sdk package to operate on bucket objects.

### Q4. Why did you choose to go with non-relational database?

- scalabality
- flexible data models
- performance

### Q5. Explain the data flow in your database

I will explain it using ER diagram.

## Business questions

### Q1. Describe your business

My business consists of importing eco-friendly, sustainable products from global/local manufactures and selling them online/in-store for local customers in Uzbekistan. The main difference of this e-commerce from competitors is that it only sells as I said, eco-friendly alternatives to products of everyday use. The idea is reflected on every aspect/stage of business process. Packaging, delivery, storing.

### Q2. How do you plan to realize your business idea?

- attracting investors
- legal compliance

### Q3. What are the current limitations?

- online payment methods are not integrated
- you have to be legal entity to get access to sms messaging service such as sms.uz or playmobile.uz (shartnoma qilish kk)
- website should be fed with real products delivered from suppliers or manufactures

### Q4. What next main features do you plan to implement?

- integration with online payment methods such as humo, uzcard, payme, uzum
- real-time notifications with websockets
- sms marketing templates
- seo for higher search engine results

### Q5. What other integral parts of the business process left to discuss/implement?

- choosing manufactures and suppliers to work with
- deciding business type and legal compliance
- renting warehouse and stores, hiring couriers, staff
- implementing courier app to update delivery status
- integrating with yandex services such as y metrica, y direct, y webmaster, y direct turbo pages, y business directory

## TODO

- scoped merchant access to entities
- dashboard api endpoints for merchant
- rethink wishlist
- merchant field
- proper error handling
- remove slug uses
- remove null values
