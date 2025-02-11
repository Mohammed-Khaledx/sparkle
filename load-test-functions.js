const users = new Set();
const posts = new Set();

function generateUser(userContext, events, done) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  
  const user = {
    name: `TestUser_${timestamp}_${random}`,
    email: `testuser_${timestamp}_${random}@test.com`,
    password: 'Test@123'
  };
  
  userContext.vars.name = user.name;
  userContext.vars.email = user.email;
  userContext.vars.password = user.password;
  
  return done();
}

// Store successful registrations
function storeUser(requestParams, response, context, ee, next) {
  if (response.statusCode === 201) {
    users.add({
      id: response.body.user._id,
      token: response.body.token
    });
  }
  return next();
}

// Add more manageable error handling
function handleError(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.error(`Error: ${response.statusCode} - ${JSON.stringify(response.body)}`);
  }
  return next();
}

module.exports = {
  generateUser,
  storeUser,
  handleError
};