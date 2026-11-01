const fs = require('fs');
const path = require('path');

describe('Seed akun demo', () => {
    it('Harus menggunakan hash bcrypt yang valid untuk password123 pada database.sql', () => {
        const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database.sql'), 'utf8');
        const hashBenar = '$2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK';

        expect(sql).toContain(hashBenar);
    });
});
