const axios = require('axios');
async function testRegister() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            nim: '12345',
            nama: 'Test User',
            email: 'test@example.com',
            kata_sandi: 'password123'
        });
        console.log('Register success:', res.data);
    } catch (error) {
        console.error('Register error:', error.response?.data || error.message);
    }
}
testRegister();