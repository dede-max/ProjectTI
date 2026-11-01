const axios = require('axios');
async function testLogin() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            nama_pengguna: 'admin@kampus.edu',
            kata_sandi: 'password123'
        });
        console.log('Login success:', res.data);
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
    }
}
testLogin();