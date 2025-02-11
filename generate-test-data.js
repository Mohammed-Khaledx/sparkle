const axios = require('axios');
const { faker } = require('@faker-js/faker');

const API_URL = 'http://localhost:3000';
const TOTAL_USERS = 50;
const POSTS_PER_USER = 5;
const MAX_FOLLOWS_PER_USER = 10;

// Store created users
const users = [];

async function generateData() {
  try {
    console.log('🚀 Starting test data generation...');

    // 1. Create users
    console.log(`\n📝 Creating ${TOTAL_USERS} users...`);
    for (let i = 0; i < TOTAL_USERS; i++) {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123'
      };

      const response = await axios.post(`${API_URL}/users/register`, userData);
      users.push({
        ...response.data.user,
        token: response.data.token
      });
      
      process.stdout.write(`Created user ${i + 1}/${TOTAL_USERS}\r`);
    }

    // 2. Create posts for each user
    console.log('\n\n📫 Creating posts...');
    for (const user of users) {
      for (let i = 0; i < POSTS_PER_USER; i++) {
        const postData = {
          content: faker.lorem.paragraph()
        };

        await axios.post(
          `${API_URL}/posts`,
          postData,
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
      }
      process.stdout.write(`Created posts for user ${users.indexOf(user) + 1}/${TOTAL_USERS}\r`);
    }

    // 3. Create follow relationships
    console.log('\n\n🤝 Creating follow relationships...');
    for (const user of users) {
      // Randomly select users to follow
      const otherUsers = users.filter(u => u._id !== user._id);
      const numToFollow = Math.floor(Math.random() * MAX_FOLLOWS_PER_USER) + 1;
      const usersToFollow = faker.helpers.arrayElements(otherUsers, numToFollow);

      for (const userToFollow of usersToFollow) {
        await axios.post(
          `${API_URL}/followOrUnfollow/${userToFollow._id}/follow`,
          {},
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
      }
      process.stdout.write(`Created follows for user ${users.indexOf(user) + 1}/${TOTAL_USERS}\r`);
    }

    // 4. Add sparks to posts
    console.log('\n\n⚡ Adding sparks to posts...');
    const posts = (await axios.get(`${API_URL}/posts`)).data.posts;
    
    for (const user of users) {
      const postsToSpark = faker.helpers.arrayElements(posts, Math.floor(Math.random() * 10) + 1);
      
      for (const post of postsToSpark) {
        try {
          await axios.post(
            `${API_URL}/posts/${post._id}/spark`,
            {},
            {
              headers: { Authorization: `Bearer ${user.token}` }
            }
          );
        } catch (error) {
          // Ignore if already sparked
          continue;
        }
      }
      process.stdout.write(`Added sparks for user ${users.indexOf(user) + 1}/${TOTAL_USERS}\r`);
    }

    // 5. Add comments
    console.log('\n\n💭 Adding comments...');
    for (const user of users) {
      const postsToComment = faker.helpers.arrayElements(posts, Math.floor(Math.random() * 5) + 1);
      
      for (const post of postsToComment) {
        await axios.post(
          `${API_URL}/posts/${post._id}/comments`,
          {
            content: faker.lorem.sentence()
          },
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
      }
      process.stdout.write(`Added comments for user ${users.indexOf(user) + 1}/${TOTAL_USERS}\r`);
    }

    console.log('\n\n✅ Test data generation complete!');
    console.log(`Created:
    - ${TOTAL_USERS} users
    - ${TOTAL_USERS * POSTS_PER_USER} posts
    - Multiple follow relationships
    - Multiple sparks and comments`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Install required dependencies first:
// npm install axios @faker-js/faker
// node generate-test-data.js
generateData();