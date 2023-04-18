const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  let resolvedUser = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      resolvedUser = user;
    }
  }
  return Promise.resolve(resolvedUser);
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return Promise.resolve(users[id]);
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const userId = Object.keys(users).length + 1;
  user.id = userId;
  users[userId] = user;
  return Promise.resolve(user);
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {

  return pool
  .query(
 `SELECT reservations.id AS id, properties.title AS title, reservations.start_date AS start_date, cost_per_night, avg(rating)
  FROM reservations
  JOIN properties ON property_id = properties.id
  JOIN property_reviews ON reservation_id = reservations.id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.title, reservations.start_date, cost_per_night
  ORDER BY start_date DESC
  LIMIT $2`,
[guest_id, limit]
  )
  .then((result) => {
    console.log(result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {

 const queryParams = [];

 let queryString = `
 SELECT properties.*, avg(property_reviews.rating) as average_rating
 FROM properties
 JOIN property_reviews ON properties.id = property_id
 `;

 if (options.city) {
  queryParams.push(`%${options.city}%`);
  queryString += `WHERE city LIKE $${queryParams.length}`;
 }

 if(options.owner_id){

  if (queryParams.length === 0) {
    queryString += `WHERE `;
  } else {
    queryString += `AND `;
  }

  queryParams.push(options.owner_id);
  queryString += `owner_id = $${queryParams.length}`;
 }

 if (options.minimum_price_per_night && options.maximum_price_per_night) {
  if (queryParams.length === 0) {
    queryString += `WHERE `;
  } else {
    queryString += `AND `;
  }
  queryParams.push(options.minimum_price_per_night * 100, options.maximum_price_per_night * 100);
  queryString += `cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
 }

 if (options.minimum_rating) {
  if (queryParams.length === 0) {
    queryString += `WHERE `;
  } else {
    queryString += `AND `;
  }
  queryParams.push(options.minimum_rating);
  queryString += `average_rating >= $${queryParams.length}`;
 }

 queryParams.push(limit);
 queryString += `
 GROUP BY properties.id
 ORDER BY cost_per_night
 LIMIT $${queryParams.length};
 `;
 
 console.log(queryString, queryParams);

 return pool.query(queryString, queryParams).then((res) => res.row);
};
/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  return pool
  .query(
    `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
     [
      property.owner_id,
      property.title,
      property.description,
      property.thumbnail_photo_url,
      property.cover_photo_url,
      property.cost_per_night,
      property.street,
      property.city,
      property.province,
      property.post_code,
      property.country,
      property.parking_spaces,
      property.number_of_bathrooms,
      property.number_of_bedrooms
    ]
  )
  .then((result) => {
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });



};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
